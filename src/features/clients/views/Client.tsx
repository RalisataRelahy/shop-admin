import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, UserRound, Users, X } from "lucide-react";
import { supabase } from "../../../supabase/config";
import "./Client.css";

interface Client {
  id: string;
  pseudo: string | null;
  phone: string | null;
  role: string | null;
  created_at: string | null;
  is_active: boolean | null;
}

type PresencePayload = { user_id?: string; role?: string };

const formatDate = (date: string | null) =>
  date
    ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(date))
    : "—";

// Initiales des deux premiers mots ("Jean Dupont" -> "JD"), pas les deux
// premiers caractères bruts ("Jean Dupont" -> "JE").
const initials = (name: string | null): string => {
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (words.length === 0) return "CL";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

// Retire les accents pour une recherche plus tolérante.
const normalize = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export default function ClientScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [onlineClientIds, setOnlineClientIds] = useState<Set<string>>(new Set());
  const [pendingToggle, setPendingToggle] = useState<Client | null>(null);

  // `isInitialLoad` distingue le tout premier chargement (où l'on veut
  // l'état "Chargement…") des rechargements silencieux déclenchés par le
  // temps réel ou le bouton Actualiser (où l'on garde le tableau visible).
  const loadClients = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setLoading(true);
    else setRefreshing(true);

    // is_active DOIT être sélectionné : c'est ce champ qui pilote l'affichage
    // du statut et le libellé du bouton d'action.
    const { data, error } = await supabase
      .from("profiles")
      .select("id, pseudo, phone, role, created_at, is_active")
      .eq("role", "client")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setClients((data ?? []) as Client[]);
      setErrorMessage(null);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadClients(true);
    const profilesChannel = supabase
      .channel("clients-profiles-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: "role=eq.client" },
        () => void loadClients(false)
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(profilesChannel);
    };
  }, [loadClients]);

  useEffect(() => {
    const presenceChannel = supabase.channel("online-users", {
      config: { presence: { key: `admin-${crypto.randomUUID()}` } },
    });

    const synchronizePresence = () => {
      const state = presenceChannel.presenceState<PresencePayload>();
      const connectedClientIds = new Set(
        Object.values(state)
          .flat()
          .filter((presence) => presence.role === "client" && Boolean(presence.user_id))
          .map((presence) => presence.user_id as string)
      );
      setOnlineClientIds(connectedClientIds);
    };

    presenceChannel
      .on("presence", { event: "sync" }, synchronizePresence)
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;
        const { data } = await supabase.auth.getUser();
        if (data.user) await presenceChannel.track({ user_id: data.user.id, role: "admin" });
      });

    return () => {
      void presenceChannel.untrack();
      void supabase.removeChannel(presenceChannel);
    };
  }, []);

  const visibleClients = useMemo(() => {
    const normalizedQuery = normalize(query.trim());
    if (!normalizedQuery) return clients;
    return clients.filter((client) =>
      [client.pseudo, client.phone, client.role]
        .filter(Boolean)
        .some((value) => normalize(value as string).includes(normalizedQuery))
    );
  }, [clients, query]);

  const isOnline = (client: Client) => onlineClientIds.has(client.id);
  const isActive = (client: Client) => client.is_active !== false;

  const requestToggle = (client: Client) => setPendingToggle(client);

  const confirmToggle = async () => {
    if (!pendingToggle) return;
    const client = pendingToggle;
    const nextStatus = !isActive(client);
    setPendingToggle(null);
    setUpdatingId(client.id);

    // Mise à jour optimiste : on ne veut pas laisser l'admin dans le doute
    // pendant l'aller-retour réseau.
    setClients((current) =>
      current.map((item) => (item.id === client.id ? { ...item, is_active: nextStatus } : item))
    );

    const { error } = await supabase.from("profiles").update({ is_active: nextStatus }).eq("id", client.id);

    if (error) {
      setErrorMessage(error.message);
      // Rollback si l'update échoue côté serveur.
      setClients((current) =>
        current.map((item) => (item.id === client.id ? { ...item, is_active: !nextStatus } : item))
      );
    } else {
      setErrorMessage(null);
    }
    setUpdatingId(null);
  };

  const onlineCount = clients.filter(isOnline).length;

  return (
    <main className="clients-page">
      <section className="clients-container">
        <header className="clients-header">
          <div>
            <p className="clients-eyebrow">Administration</p>
            <h1>Gestion des clients</h1>
            <p className="clients-subtitle">Consultez vos clients et gérez l'accès à leur compte.</p>
          </div>
          <button
            className="clients-refresh"
            onClick={() => void loadClients(false)}
            disabled={loading || refreshing}
          >
            <RefreshCw size={18} className={loading || refreshing ? "is-spinning" : ""} />
            Actualiser
          </button>
        </header>

        <div className="clients-stats">
          <article className="clients-stat-card">
            <span className="clients-stat-icon">
              <Users size={21} />
            </span>
            <div>
              <span>Total clients</span>
              <strong>{clients.length}</strong>
            </div>
          </article>
          <article className="clients-stat-card online">
            <span className="clients-stat-icon">
              <UserRound size={21} />
            </span>
            <div>
              <span>Clients en ligne</span>
              <strong>{onlineCount}</strong>
            </div>
          </article>
        </div>

        <section className="clients-panel">
          <div className="clients-toolbar">
            <div>
              <h2>Liste des clients</h2>
              <p>
                {visibleClients.length} client{visibleClients.length > 1 ? "s" : ""} affiché
                {visibleClients.length > 1 ? "s" : ""}
              </p>
            </div>
            <label className="clients-search" style={{ position: "relative" }}>
              <Search size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un client..."
                aria-label="Rechercher un client"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Effacer la recherche"
                  title="Effacer"
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    display: "flex",
                    color: "inherit",
                    opacity: 0.6,
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </label>
          </div>

          {errorMessage && (
            <div className="clients-error" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                style={{ border: "none", background: "none", cursor: "pointer", fontWeight: 600, color: "inherit" }}
              >
                Fermer
              </button>
            </div>
          )}

          <div className="clients-table-wrap">
            <table className="clients-table">
              <thead>
                <tr>
                  <th scope="col">Client</th>
                  <th scope="col">Contact</th>
                  <th scope="col">Inscription</th>
                  <th scope="col">Présence</th>
                  <th scope="col">Statut</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="clients-empty">
                      Chargement des clients…
                    </td>
                  </tr>
                ) : visibleClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="clients-empty">
                      {query ? "Aucun client ne correspond à votre recherche." : "Aucun client trouvé."}
                    </td>
                  </tr>
                ) : (
                  visibleClients.map((client) => {
                    const active = isActive(client);
                    const online = isOnline(client);
                    return (
                      <tr key={client.id} className={active ? "" : "is-disabled"}>
                        <td>
                          <div className="clients-user">
                            <span className="clients-avatar">{initials(client.pseudo)}</span>
                            <div>
                              <strong>{client.pseudo || "Client sans nom"}</strong>
                              <small>{client.role || "client"}</small>
                            </div>
                          </div>
                        </td>
                        <td>{client.phone || "—"}</td>
                        <td>{formatDate(client.created_at)}</td>
                        <td>
                          <span className={`clients-presence ${online ? "online" : "offline"}`}>
                            <i />
                            {online ? "En ligne" : "Hors ligne"}
                          </span>
                        </td>
                        <td>
                          <span className={`clients-status ${active ? "active" : "disabled"}`}>
                            {active ? "Actif" : "Désactivé"}
                          </span>
                        </td>
                        <td>
                          <button
                            className={active ? "clients-disable" : "clients-enable"}
                            onClick={() => requestToggle(client)}
                            disabled={updatingId === client.id}
                          >
                            {updatingId === client.id ? "Mise à jour…" : active ? "Désactiver" : "Réactiver"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      {pendingToggle && (
        <div
          onClick={() => setPendingToggle(null)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: 24,
              maxWidth: 380,
              width: "100%",
              boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
            }}
          >
            <p style={{ fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
              Voulez-vous vraiment {isActive(pendingToggle) ? "désactiver" : "réactiver"} le compte de{" "}
              <strong>{pendingToggle.pseudo || "ce client"}</strong> ?
              {isActive(pendingToggle) && " Il ne pourra plus se connecter tant que le compte est désactivé."}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setPendingToggle(null)}
                style={{
                  border: "1px solid #DEE0DB",
                  backgroundColor: "#FFFFFF",
                  fontWeight: 600,
                  fontSize: 13,
                  padding: "9px 16px",
                  borderRadius: 10,
                  cursor: "pointer",
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => void confirmToggle()}
                autoFocus
                style={{
                  border: "none",
                  backgroundColor: isActive(pendingToggle) ? "#C4453C" : "#128171",
                  color: "#FFFFFF",
                  fontWeight: 600,
                  fontSize: 13,
                  padding: "9px 16px",
                  borderRadius: 10,
                  cursor: "pointer",
                }}
              >
                {isActive(pendingToggle) ? "Désactiver" : "Réactiver"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}