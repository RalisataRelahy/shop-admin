import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Phone, RefreshCw, UserRound } from "lucide-react";
import { supabase } from "../../../supabase/config";
import "./CallRequestsScreen.css";

interface CallRequest {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  status: string;
  created_at: string;
  processed_at: string | null;
}

const waitTime = (date: string) => {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60000));
  if (minutes < 1) return "À l’instant";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} h${remainingMinutes ? ` ${remainingMinutes} min` : ""}`;
};

const requestDate = (date: string) =>
  new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }).format(new Date(date));

export default function CallRequestsScreen() {
  const [requests, setRequests] = useState<CallRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("call_requests")
      .select("id, customer_name, customer_phone, status, created_at, processed_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) setErrorMessage(error.message);
    else {
      setRequests((data ?? []) as CallRequest[]);
      setErrorMessage(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadRequests();
    const channel = supabase
      .channel("call-requests-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "call_requests" }, () => void loadRequests())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [loadRequests]);

  const oldestRequest = requests[0];
  const totalWaiting = useMemo(() => requests.length, [requests]);

  const markAsCompleted = async (request: CallRequest) => {
    setProcessingId(request.id);
    const { error } = await supabase
      .from("call_requests")
      .update({ status: "completed", processed_at: new Date().toISOString() })
      .eq("id", request.id);

    if (error) setErrorMessage(error.message);
    else {
      setRequests((current) => current.filter((item) => item.id !== request.id));
      setErrorMessage(null);
    }
    setProcessingId(null);
  };

  return (
    <main className="call-requests-page">
      <section className="call-requests-container">
        <header className="call-requests-header">
          <div>
            <p className="call-requests-eyebrow">Service client</p>
            <h1>Demandes de rappel</h1>
            <p>Les demandes les plus anciennes sont toujours affichées en premier.</p>
          </div>
          <button className="call-refresh" onClick={() => void loadRequests()} disabled={loading}>
            <RefreshCw size={18} className={loading ? "call-spinning" : ""} /> Actualiser
          </button>
        </header>

        <div className="call-summary">
          <article><span className="call-summary-icon"><Clock3 size={21} /></span><div><small>En attente</small><strong>{totalWaiting}</strong></div></article>
          <article className="call-oldest"><span className="call-summary-icon"><UserRound size={21} /></span><div><small>Attente la plus longue</small><strong>{oldestRequest ? waitTime(oldestRequest.created_at) : "—"}</strong></div></article>
        </div>

        <section className="call-panel">
          <div className="call-panel-title"><div><h2>File d’attente</h2><p>Traitez les demandes dans cet ordre pour réduire le temps d’attente.</p></div><span className="call-order-note">Plus ancien → plus récent</span></div>
          {errorMessage && <div className="call-error">{errorMessage}</div>}

          <div className="call-list">
            {loading ? <p className="call-empty">Chargement des demandes…</p> : requests.length === 0 ? <p className="call-empty">Aucune demande de rappel en attente.</p> : requests.map((request, index) => (
              <article className="call-request-card" key={request.id}>
                <span className="call-rank">{index + 1}</span>
                <span className="call-avatar">{request.customer_name?.trim().slice(0, 2).toUpperCase() || "CL"}</span>
                <div className="call-request-person"><strong>{request.customer_name || "Client sans nom"}</strong><a href={`tel:${request.customer_phone ?? ""}`}>{request.customer_phone || "Téléphone non renseigné"}</a></div>
                <div className="call-request-time"><span>Demandé le {requestDate(request.created_at)}</span><strong><Clock3 size={15} /> En attente depuis {waitTime(request.created_at)}</strong></div>
                <div className="call-actions"><a className="call-phone" href={`tel:${request.customer_phone ?? ""}`} aria-label={`Appeler ${request.customer_name ?? "le client"}`}><Phone size={17} /> Appeler</a><button onClick={() => void markAsCompleted(request)} disabled={processingId === request.id}><CheckCircle2 size={17} />{processingId === request.id ? "Mise à jour…" : "Traité"}</button></div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
