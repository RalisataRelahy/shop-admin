import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, UserRound, Users } from "lucide-react";
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

const initials = (name: string | null) => name?.trim().slice(0, 2).toUpperCase() || "CL";

export default function ClientScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [onlineClientIds, setOnlineClientIds] = useState<Set<string>>(new Set());

  const loadClients = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, pseudo, phone, role, created_at")
      .eq("role", "client")
      .order("created_at", { ascending: false });
    if (error) setErrorMessage(error.message);
    else {
      setClients((data ?? []) as Client[]);
      setErrorMessage(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadClients();
    const profilesChannel = supabase
      .channel("clients-profiles-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter: "role=eq.client" }, () => void loadClients())
      .subscribe();
    return () => { void supabase.removeChannel(profilesChannel); };
  }, [loadClients]);

  useEffect(() => {
    const presenceChannel = supabase.channel("online-users", {
      config: { presence: { key: `admin-${crypto.randomUUID()}` } },
    });
    const synchronizePresence = () => {
      const state = presenceChannel.presenceState<PresencePayload>();
      const connectedClientIds = new Set(
        Object.values(state).flat().filter((presence) => presence.role === "client" && Boolean(presence.user_id)).map((presence) => presence.user_id as string),
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
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return clients;
    return clients.filter((client) => [client.pseudo, client.phone, client.role].filter(Boolean).some((value) => value!.toLowerCase().includes(normalizedQuery)));
  }, [clients, query]);

  const isOnline = (client: Client) => onlineClientIds.has(client.id);
  const isActive = (client: Client) => client.is_active !== false;

  const toggleClient = async (client: Client) => {
    const nextStatus = !isActive(client);
    const action = nextStatus ? "réactiver" : "désactiver";
    if (!window.confirm(`Voulez-vous vraiment ${action} ce client ?`)) return;
    setUpdatingId(client.id);
    const { error } = await supabase.from("profiles").update({ is_active: nextStatus }).eq("id", client.id);
    if (error) setErrorMessage(error.message);
    else {
      setClients((current) => current.map((item) => item.id === client.id ? { ...item, is_active: nextStatus } : item));
      setErrorMessage(null);
    }
    setUpdatingId(null);
  };

  const onlineCount = clients.filter(isOnline).length;

  return <main className="clients-page"><section className="clients-container"><header className="clients-header"><div><p className="clients-eyebrow">Administration</p><h1>Gestion des clients</h1><p className="clients-subtitle">Consultez vos clients et gérez l’accès à leur compte.</p></div><button className="clients-refresh" onClick={() => void loadClients()} disabled={loading}><RefreshCw size={18} className={loading ? "is-spinning" : ""} />Actualiser</button></header><div className="clients-stats"><article className="clients-stat-card"><span className="clients-stat-icon"><Users size={21} /></span><div><span>Total clients</span><strong>{clients.length}</strong></div></article><article className="clients-stat-card online"><span className="clients-stat-icon"><UserRound size={21} /></span><div><span>Clients en ligne</span><strong>{onlineCount}</strong></div></article></div><section className="clients-panel"><div className="clients-toolbar"><div><h2>Liste des clients</h2><p>{visibleClients.length} client{visibleClients.length > 1 ? "s" : ""} affiché{visibleClients.length > 1 ? "s" : ""}</p></div><label className="clients-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un client..." aria-label="Rechercher un client" /></label></div>{errorMessage && <div className="clients-error">{errorMessage}</div>}<div className="clients-table-wrap"><table className="clients-table"><thead><tr><th>Client</th><th>Contact</th><th>Inscription</th><th>Présence</th><th>Statut</th><th>Action</th></tr></thead><tbody>{loading ? <tr><td colSpan={6} className="clients-empty">Chargement des clients…</td></tr> : visibleClients.length === 0 ? <tr><td colSpan={6} className="clients-empty">Aucun client trouvé.</td></tr> : visibleClients.map((client) => { const active = isActive(client); const online = isOnline(client); return <tr key={client.id} className={active ? "" : "is-disabled"}><td><div className="clients-user"><span className="clients-avatar">{initials(client.pseudo)}</span><div><strong>{client.pseudo || "Client sans nom"}</strong><small>{client.role || "client"}</small></div></div></td><td>{client.phone || "—"}</td><td>{formatDate(client.created_at)}</td><td><span className={`clients-presence ${online ? "online" : "offline"}`}><i />{online ? "En ligne" : "Hors ligne"}</span></td><td><span className={`clients-status ${active ? "active" : "disabled"}`}>{active ? "Actif" : "Désactivé"}</span></td><td><button className={active ? "clients-disable" : "clients-enable"} onClick={() => void toggleClient(client)} disabled={updatingId === client.id}>{updatingId === client.id ? "Mise à jour…" : active ? "Désactiver" : "Réactiver"}</button></td></tr>; })}</tbody></table></div></section></section></main>;
}
