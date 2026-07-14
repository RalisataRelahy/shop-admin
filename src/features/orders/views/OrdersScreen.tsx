import React, { useEffect, useMemo, useState } from 'react';
import { type RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../../../supabase/config';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';

// ============================================================================
// MODELE DE DONNEES
// ----------------------------------------------------------------------------
// `statut` reflète exactement la contrainte CHECK / ENUM côté base :
//   ARRAY['non_confirmer','reçue','acceptée','en_preparation','prete',
//         'en_cours_de_livraison','livree','annulee']
// Ce tableau ne fait QUE lire, mettre à jour le statut, et supprimer.
// Aucune création de commande ici (les commandes arrivent côté client).
// ============================================================================

export type OrderStatus =
  | 'non_confirmer'
  | 'reçue'
  | 'en_preparation'
  | 'en_cours_de_livraison'
  | 'livree'
  | 'annulee';

// Ligne d'article jointe : chaque ligne référence SOIT product_id (plat, table
// "menu"), SOIT combo_id (table "combo"), jamais les deux. `unit_price` est le
// prix figé au moment de la commande — on l'affiche toujours à la place du
// prix courant du produit, qui a pu changer depuis.
export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string | null;
  combo_id: string | null;
  quantity: number;
  unit_price: number;
  // Jointures Supabase (alias:colonne) — ajuste les noms de table/colonnes
  // ci-dessous (MENU_TABLE / COMBO_TABLE, image_url...) si ton schéma diffère.
  menu: { id: string; name: string; image_url: string } | null;
  combo: { id: string; name: string; image_url: string } | null;
  // Champs optionnels retournés par la jointure
  notes?: string | null;
  variante?: { id: string; name: string } | null;
}

export interface Order {
  id: string;
  user_id: string;
  statut: OrderStatus;
  delivery_mode: 'pickup' | 'delivery' | string;
  notes: string | null;
  payment_method: 'mobile_money' | 'especes' | string;
  total_price: number;
  client_phone: string;
  client_name:string;
  created_at: string;
  order_items: OrderItemRow[];
}

// --- Noms de tables/colonnes réelles — à ajuster si besoin ---
const ORDERS_TABLE = 'orders';
const ORDER_ITEMS_TABLE = 'order_items'; // ex: 'orders_item' si c'est le vrai nom
// const CLIENT_TABLE = 'profiles';
// const COMBO_TABLE = 'combo';

// Sélection complète : commande + ses articles + le plat OU le combo lié.
const ORDER_SELECT_QUERY = `
  *,
  ${ORDER_ITEMS_TABLE} (
    id,
    order_id,
    product_id,
    combo_id,
    quantity,
    unit_price,
    notes,
    variante:variant_id(id, name),
    menu:product_id(id, name, image_url),
    combo:combo_id(id, name, image_url)
  )
`;

/** Résout l'affichage d'un article : plat, combo, ou produit supprimé. */
function resolveItemDisplay(item: OrderItemRow): { name: string; imageUrl: string | null } {
  if (item.combo_id && item.combo) {
    return { name: item.combo.name, imageUrl: item.combo.image_url };
  }
  if (item.product_id && item.menu) {
    return { name: item.menu.name, imageUrl: item.menu.image_url };
  }
  return { name: 'Article indisponible', imageUrl: null };
}

// Ordre logique du cycle de vie d'une commande (utilisé pour le filtre et le select).
const STATUS_ORDER: OrderStatus[] = [
  'non_confirmer',
  'reçue',
  'en_preparation',
  'en_cours_de_livraison',
  'livree',
  'annulee',
];

const STATUS_META: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  non_confirmer: { label: 'Non confirmée', color: '#e91000', bg: '#ffcdcd' },
  'reçue': { label: 'Reçue', color: '#4A6FA5', bg: '#E9F0F9' },
  en_preparation: { label: 'En préparation', color: '#B8791F', bg: '#FBF0DF' },
  en_cours_de_livraison: { label: 'En livraison', color: '#5B57A6', bg: '#ECEBF7' },
  livree: { label: 'Livrée', color: '#3E6E1F', bg: '#E3EEDA' },
  annulee: { label: 'Annulée', color: '#B23A32', bg: '#FBEAE8' },
};

const DELIVERY_MODE_LABEL: Record<string, string> = {
  pickup: 'À récupérer',
  delivery: 'En livraison',
};

const PAYMENT_LABEL: Record<string, string> = {
  mobile_money: 'Mobile Money',
  especes: 'Espèces',
};

const COLORS = {
  appleGreen: '#7CBB3F',
  appleGreenDark: '#5C9A2C',
  lightGray: '#F1F2F0',
  midGray: '#DEE0DB',
  offWhite: '#FAF8F4',
  textDark: '#2E2E2B',
  textMuted: '#8A8D85',
  danger: '#C4453C',
};

function formatPrice(value: number): string {
  return `${value.toLocaleString('fr-FR')} Ar`;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
export default function OrdersDashboard(): React.JSX.Element {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (orderId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  // --- READ : chargement initial (commande + articles joints) ---
  const fetchOrders = async (): Promise<void> => {
    const { data, error } = await supabase
      .from(ORDERS_TABLE)
      .select(ORDER_SELECT_QUERY)
      .order('created_at', { ascending: false });

    if (!error && data) {
      console.log(data);
      setOrders(data as unknown as Order[]);
    } else if (error) {
      setErrorMessage('Impossible de charger les commandes.');
    }
    setLoading(false);
  };

  // Le flux temps réel de `orders` ne contient PAS les lignes jointes de
  // order_items (Supabase Realtime n'envoie que la table concernée). On
  // recharge donc cette commande précise avec sa jointure à chaque INSERT/UPDATE.
  const fetchOrderWithItems = async (orderId: string): Promise<Order | null> => {
    const { data, error } = await supabase
      .from(ORDERS_TABLE)
      .select(ORDER_SELECT_QUERY)
      .eq('id', orderId)
      .single();

    if (error || !data) return null;
    return data as unknown as Order;
  };

  useEffect(() => {
    fetchOrders();

    const ordersSubscription = supabase
      .channel('table-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: ORDERS_TABLE },
        async (payload: RealtimePostgresChangesPayload<Order>) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const fullOrder = await fetchOrderWithItems((payload.new as Order).id);
            if (fullOrder) setOrders((prev) => [fullOrder, ...prev]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedId = (payload.new as Order).id;
            const fullOrder = await fetchOrderWithItems(updatedId);
            if (fullOrder) {
              setOrders((prev) => prev.map((order) => (order.id === updatedId ? fullOrder : order)));
            }
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const deletedOrderId = payload.old.id;
            setOrders((prev) => prev.filter((order) => order.id !== deletedOrderId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
    };
  }, []);

  // --- UPDATE : changement de statut ---
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus): Promise<void> => {
    setUpdatingId(orderId);
    const { error } = await supabase
      .from('orders')
      .update({ statut: newStatus })
      .eq('id', orderId);

    if (error) {
      setErrorMessage(`Échec de la mise à jour : ${error.message}`);
    }
    setUpdatingId(null);
  };

  // --- DELETE : suppression confirmée ---
  const confirmDelete = async (): Promise<void> => {
    if (!pendingDeleteId) return;
    const idToDelete = pendingDeleteId;
    setPendingDeleteId(null);

    const { error } = await supabase.from('orders').delete().eq('id', idToDelete);
    if (error) {
      setErrorMessage(`Échec de la suppression : ${error.message}`);
    }
  };

  const counts = useMemo(() => {
    const base: Record<string, number> = { all: orders.length };
    for (const s of STATUS_ORDER) base[s] = 0;
    for (const o of orders) base[o.statut] = (base[o.statut] ?? 0) + 1;
    return base;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'all') return orders;
    return orders.filter((o) => o.statut === activeFilter);
  }, [orders, activeFilter]);

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(124,187,63,0.45); }
          70% { box-shadow: 0 0 0 8px rgba(124,187,63,0); }
          100% { box-shadow: 0 0 0 0 rgba(124,187,63,0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .order-card { animation: fadeIn 0.28s ease-out; transition: box-shadow 0.18s ease, border-color 0.18s ease; }
        .order-card:hover { box-shadow: 0 4px 14px rgba(46,46,43,0.06); border-color: #D8DAD5; }
        .filter-pill { transition: background-color 0.15s ease, color 0.15s ease; }
        .icon-btn { transition: background-color 0.15s ease, transform 0.1s ease; }
        .icon-btn:active { transform: scale(0.96); }
        select.status-select { transition: border-color 0.15s ease; }
        select.status-select:hover { border-color: ${COLORS.appleGreen}; }
      `}</style>

      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Commandes</h1>
          <div style={styles.liveRow}>
            <span style={styles.liveDot} />
            <span style={styles.liveText}>Synchronisation en direct</span>
          </div>
        </div>
        <div style={styles.totalBadge}>
          <span style={styles.totalNumber}>{orders.length}</span>
          <span style={styles.totalLabel}>commande{orders.length > 1 ? 's' : ''}</span>
        </div>
      </header>

      {errorMessage && (
        <div style={styles.errorBanner}>
          <span>{errorMessage}</span>
          <button style={styles.errorDismiss} onClick={() => setErrorMessage(null)}>
            Fermer
          </button>
        </div>
      )}

      {/* --- Filtres par statut --- */}
      <div style={styles.filterBar}>
        <FilterPill
          label="Toutes"
          count={counts.all}
          active={activeFilter === 'all'}
          onClick={() => setActiveFilter('all')}
        />
        {STATUS_ORDER.map((s) => (
          <FilterPill
            key={s}
            label={STATUS_META[s].label}
            count={counts[s] ?? 0}
            active={activeFilter === s}
            color={STATUS_META[s].color}
            onClick={() => setActiveFilter(s)}
          />
        ))}
      </div>

      {/* --- Liste des commandes --- */}
      {loading ? (
        <div style={styles.list}>
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyTitle}>Aucune commande</p>
          <p style={styles.emptyText}>
            {activeFilter === 'all'
              ? 'Les nouvelles commandes apparaîtront ici automatiquement.'
              : 'Aucune commande ne correspond à ce statut pour le moment.'}
          </p>
        </div>
      ) : (
        <div style={styles.list}>
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isUpdating={updatingId === order.id}
              expanded={expandedIds.has(order.id)}
              onToggleExpanded={() => toggleExpanded(order.id)}
              onStatusChange={(status) => handleUpdateStatus(order.id, status)}
              onDeleteRequest={() => setPendingDeleteId(order.id)}
            />
          ))}
        </div>
      )}

      {pendingDeleteId && (
        <ConfirmDialog
          message="Supprimer définitivement cette commande ? Cette action est irréversible."
          onCancel={() => setPendingDeleteId(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

// ============================================================================
// SOUS-COMPOSANTS
// ============================================================================

function FilterPill({
  label,
  count,
  active,
  color,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      className="filter-pill"
      onClick={onClick}
      style={{
        ...styles.pill,
        backgroundColor: active ? (color ?? COLORS.textDark) : COLORS.lightGray,
        color: active ? '#FFFFFF' : COLORS.textMuted,
      }}
    >
      {label}
      <span
        style={{
          ...styles.pillCount,
          backgroundColor: active ? 'rgba(255,255,255,0.22)' : 'rgba(46,46,43,0.08)',
          color: active ? '#FFFFFF' : COLORS.textMuted,
        }}
      >
        {count}
      </span>
    </button>
  );
}

function OrderCard({
  order,
  isUpdating,
  expanded,
  onToggleExpanded,
  onStatusChange,
  onDeleteRequest,
}: {
  order: Order;
  isUpdating: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  onStatusChange: (status: OrderStatus) => void;
  onDeleteRequest: () => void;
}) {
  const meta = STATUS_META[order.statut] ?? STATUS_META.non_confirmer;
  const items = order.order_items ?? [];
  const itemCount = items.reduce((sum, it) => sum + it.quantity, 0);

  return (
    <div className="order-card" style={{ ...styles.card, borderLeft: `4px solid ${meta.color}` }}>
      <div style={styles.cardBody}>
        <div style={styles.cardMain}>
          <div style={styles.cardTopRow}>
            <span style={styles.orderId}>#{order.id.slice(0, 8)}</span>
            {meta.label === "Non confirmée" ? (
              <span style={{ ...styles.statusBadgeNonConfirmer, color: meta.color, backgroundColor: meta.bg }}>
                {meta.label}
              </span>
            ) : (
              <span style={{ ...styles.statusBadge, color: meta.color, backgroundColor: meta.bg }}>
                {meta.label}
              </span>
            )}
          </div>


          <div style={styles.metaRow}>
            <MetaItem label="Téléphone" value={order.client_phone} />
            <MetaItem label="Nom du commanditaire" value={order.client_name} />
            <MetaItem label="Totale" value={formatPrice(order.total_price)} emphasize />
            <MetaItem
              label="Mode de recuperation"
              value={DELIVERY_MODE_LABEL[order.delivery_mode] ?? order.delivery_mode}
            />
            <MetaItem
              label="Methode de Paiement"
              value={PAYMENT_LABEL[order.payment_method] ?? order.payment_method}
            />
            <MetaItem label="Reçue le" value={formatDate(order.created_at)} />
          </div>

          {order.notes && <p style={styles.notes}>{order.notes}</p>}

          {items.length > 0 && (
            <button style={styles.expandToggle} onClick={onToggleExpanded}>
              {expanded ? (
                <>
                  Masquer les articles <IoChevronUp size={14} />
                </>
              ) : (
                <>
                  Voir les articles ({itemCount}) <IoChevronDown size={14} color="#2C2C2E" />
                </>
              )}
            </button>

          )}
        </div>

        <div style={styles.cardActions}>
          <select
            className="status-select"
            value={order.statut}
            disabled={isUpdating}
            onChange={(e) => onStatusChange(e.target.value as OrderStatus)}
            style={styles.select}
          >
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>

          <button
            className="icon-btn"
            onClick={onDeleteRequest}
            style={styles.deleteBtn}
            aria-label="Supprimer la commande"
          >
            Supprimer
          </button>
        </div>
      </div>

      {expanded && items.length > 0 && (
        <div style={styles.itemsPanel}>
          {items.map((item) => {
            const { name, imageUrl } = resolveItemDisplay(item);
            const lineTotal = item.quantity * item.unit_price;
            return (
              <div key={item.id} style={styles.itemRow}>
                {imageUrl ? (
                  <img src={imageUrl} alt={name} style={styles.itemThumb} />
                ) : (
                  <div style={styles.itemThumbFallback} />
                )}
                <div style={styles.itemInfo}>
                  <span style={styles.itemName}>{name}</span>
                  {item.variante?.name && (
                    <span style={{ ...styles.itemName, marginTop: 4 }}>Taille: {item.variante.name}</span>
                  )}
                  <span style={styles.itemQty}>
                    {item.quantity} × {formatPrice(item.unit_price)}
                  </span>
                </div>
                <span style={styles.itemTotal}>{formatPrice(lineTotal)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MetaItem({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div style={styles.metaItem}>
      <span style={styles.metaLabel}>{label}</span>
      <span style={{ ...styles.metaValue, ...(emphasize ? styles.metaValueStrong : {}) }}>
        {value}
      </span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={styles.skeletonCard}>
      <div style={{ ...styles.skeletonBlock, width: '35%', height: 14 }} />
      <div style={{ ...styles.skeletonBlock, width: '60%', height: 12, marginTop: 12 }} />
      <div style={{ ...styles.skeletonBlock, width: '45%', height: 12, marginTop: 8 }} />
    </div>
  );
}

function ConfirmDialog({
  message,
  onCancel,
  onConfirm,
}: {
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <p style={styles.dialogText}>{message}</p>
        <div style={styles.dialogActions}>
          <button style={styles.dialogCancel} onClick={onCancel}>
            Annuler
          </button>
          <button style={styles.dialogConfirm} onClick={onConfirm}>
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STYLES
// ============================================================================
const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '28px 24px 60px',
    backgroundColor: COLORS.offWhite,
    minHeight: '100vh',
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    maxWidth: 11100,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  title: {
    color: COLORS.textDark,
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: '-0.4px',
    margin: 0,
  },
  liveRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: COLORS.appleGreen,
    animation: 'pulse 2s infinite',
  },
  liveText: { fontSize: 13, color: COLORS.textMuted },
  totalBadge: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
    backgroundColor: '#FFFFFF',
    border: `1px solid ${COLORS.midGray}`,
    borderRadius: 12,
    padding: '10px 16px',
  },
  totalNumber: { fontSize: 20, fontWeight: 700, color: COLORS.textDark },
  totalLabel: { fontSize: 13, color: COLORS.textMuted },
  errorBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FBEAE8',
    color: COLORS.danger,
    padding: '10px 16px',
    borderRadius: 10,
    fontSize: 14,
    marginBottom: 16,
  },
  errorDismiss: {
    background: 'none',
    border: 'none',
    color: COLORS.danger,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 13,
  },
  filterBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 50,
    marginBottom: 22,
  },
  pill: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    border: 'none',
    borderRadius: 30,
    padding: '7px 12px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  pillCount: {
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    padding: '1px 7px',
  },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    border: `1px solid ${COLORS.midGray}`,
    padding: '16px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  cardBody: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  cardMain: { flex: '1 1 420px', minWidth: 0 },
  cardTopRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
  orderId: {
    fontFamily: "'SFMono-Regular', Consolas, Menlo, monospace",
    fontSize: 15,
    color: COLORS.textMuted,
    letterSpacing: '0.2px',
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: 20,
  },
  statusBadgeNonConfirmer: {
    fontSize: 15,
    fontWeight: 900,
    padding: '3px 250px',
    borderRadius: 20,
  },
  metaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: 22,
    rowGap: 8,
  },
  metaItem: { display: 'flex', flexDirection: 'column', minWidth: 120 },
  metaLabel: {
    fontSize: 15,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  metaValue: { fontSize: 14, color: COLORS.textDark, fontWeight: 500 },
  metaValueStrong: { color: COLORS.appleGreenDark, fontWeight: 700 },
  notes: {
    marginTop: 10,
    marginBottom: 0,
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  cardActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  expandToggle: {
    marginTop: 10,
    border: 'none',
    background: 'none',
    color: COLORS.appleGreenDark,
    fontSize: 16,
    fontWeight: 700,
    padding: 0,
    cursor: 'pointer',
  },
  itemsPanel: {
    marginTop: 8,
    paddingTop: 12,
    borderTop: `1px solid ${COLORS.lightGray}`,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    animation: 'fadeIn 0.2s ease-out',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  itemThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    objectFit: 'cover',
    backgroundColor: COLORS.lightGray,
    flexShrink: 0,
  },
  itemThumbFallback: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
    flexShrink: 0,
  },
  itemInfo: { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 },
  itemName: {
    fontSize: 13.5,
    fontWeight: 600,
    color: COLORS.textDark,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemQty: { fontSize: 12.5, color: COLORS.textMuted, marginTop: 2 },
  itemTotal: { fontSize: 13.5, fontWeight: 700, color: COLORS.textDark, flexShrink: 0 },
  select: {
    border: `1px solid ${COLORS.midGray}`,
    borderRadius: 10,
    padding: '9px 12px',
    fontSize: 13,
    fontWeight: 600,
    color: COLORS.textDark,
    backgroundColor: COLORS.lightGray,
    cursor: 'pointer',
    outline: 'none',
  },
  deleteBtn: {
    border: 'none',
    backgroundColor: 'transparent',
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: 600,
    padding: '9px 10px',
    borderRadius: 10,
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    border: `1px dashed ${COLORS.midGray}`,
  },
  emptyTitle: { fontSize: 16, fontWeight: 700, color: COLORS.textDark, marginBottom: 6 },
  emptyText: { fontSize: 14, color: COLORS.textMuted, margin: 0 },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    border: `1px solid ${COLORS.midGray}`,
    padding: '18px 20px',
  },
  skeletonBlock: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(46,46,43,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 50,
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: '24px',
    maxWidth: 380,
    width: '100%',
    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
  },
  dialogText: { fontSize: 14, color: COLORS.textDark, marginBottom: 20, lineHeight: 1.5 },
  dialogActions: { display: 'flex', justifyContent: 'flex-end', gap: 10 },
  dialogCancel: {
    border: `1px solid ${COLORS.midGray}`,
    backgroundColor: '#FFFFFF',
    color: COLORS.textDark,
    fontWeight: 600,
    fontSize: 13,
    padding: '9px 16px',
    borderRadius: 10,
    cursor: 'pointer',
  },
  dialogConfirm: {
    border: 'none',
    backgroundColor: COLORS.danger,
    color: '#FFFFFF',
    fontWeight: 600,
    fontSize: 13,
    padding: '9px 16px',
    borderRadius: 10,
    cursor: 'pointer',
  },
};