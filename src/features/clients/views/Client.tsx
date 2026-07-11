import { useMemo, useState } from "react";
import { Search, Trash2, UserRoundCheck, UserRoundX } from "lucide-react";
import { initialClients, type ClientUser } from "../data/UsersModels";
import "./Client.css";

export default function ClientScreen() {
  const [clients, setClients] = useState<ClientUser[]>(initialClients);
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<number | null>(initialClients[0]?.id ?? null);

  const filteredClients = useMemo(() => {
    const query = search.toLowerCase();
    return clients.filter((client) =>
      [client.name, client.email, client.city, client.loyalty].some((value) => value.toLowerCase().includes(query)),
    );
  }, [clients, search]);

  const selectedClient = useMemo(() => {
    return filteredClients.find((client) => client.id === selectedClientId) ?? filteredClients[0] ?? null;
  }, [filteredClients, selectedClientId]);

  const toggleStatus = (id: number) => {
    setClients((prev) => prev.map((client) => (client.id === id ? { ...client, active: !client.active } : client)));
  };

  const deleteClient = (id: number) => {
    setClients((prev) => prev.filter((client) => client.id !== id));
    if (selectedClientId === id) {
      setSelectedClientId(null);
    }
  };

  return (
    <div className="clients-page">
      <div className="clients-hero">
        <div>
          <h2 className="clients-title">Gestion des clients</h2>
          <p className="clients-subtitle">Consultez les profils, mettez à jour leur statut et gérez les comptes actifs.</p>
        </div>
        <div className="hero-badge">{clients.length} clients</div>
      </div>

      <div className="search-bar">
        <Search size={18} />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher par nom, email, ville ou fidélité"
        />
      </div>

      <div className="clients-grid">
        <div className="clients-list-card">
          {filteredClients.map((client) => (
            <button
              key={client.id}
              className={`client-row ${selectedClient?.id === client.id ? "active" : ""}`}
              onClick={() => setSelectedClientId(client.id)}
            >
              <img src={client.avatar} alt={client.name} className="avatar" />
              <div className="client-info">
                <div className="client-name">{client.name}</div>
                <div className="client-meta">{client.city} • {client.totalOrders} commandes</div>
              </div>
              <span className={`pill ${client.active ? "active" : "inactive"}`}>{client.active ? "Actif" : "Inactif"}</span>
            </button>
          ))}
        </div>

        <div className="client-details-card">
          {selectedClient ? (
            <>
              <div className="detail-header">
                <img src={selectedClient.avatar} alt={selectedClient.name} className="detail-avatar" />
                <div>
                  <h3>{selectedClient.name}</h3>
                  <p>{selectedClient.email}</p>
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-item">
                  <span>Téléphone</span>
                  <strong>{selectedClient.phone}</strong>
                </div>
                <div className="detail-item">
                  <span>Ville</span>
                  <strong>{selectedClient.city}</strong>
                </div>
                <div className="detail-item">
                  <span>Commandes</span>
                  <strong>{selectedClient.totalOrders}</strong>
                </div>
                <div className="detail-item">
                  <span>Fidélité</span>
                  <strong>{selectedClient.loyalty}</strong>
                </div>
              </div>

              <div className="actions-row">
                <button type="button" className="btn btn-outline" onClick={() => toggleStatus(selectedClient.id)}>
                  {selectedClient.active ? <UserRoundX size={16} /> : <UserRoundCheck size={16} />}
                  {selectedClient.active ? "Désactiver" : "Réactiver"}
                </button>
                <button type="button" className="btn btn-danger" onClick={() => deleteClient(selectedClient.id)}>
                  <Trash2 size={16} />
                  Supprimer
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">Aucun client trouvé.</div>
          )}
        </div>
      </div>
    </div>
  );
}
