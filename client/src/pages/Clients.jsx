import { useEffect, useState } from "react";
import api from "../services/api";

export default function Clients() {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    api.get("/clients").then((res) => setClients(res.data));
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">CLIENTS</span>
          <h1>Clients</h1>
          <p>Converted mortgage clients and their advisors.</p>
        </div>
      </div>

      <div className="cards-grid">
        {clients.map((client) => (
          <div className="panel client-card" key={client._id}>
            <div className="avatar">{client.firstName?.slice(0, 1).toUpperCase()}</div>
            <h3>{client.firstName} {client.lastName}</h3>
            <p>{client.email}</p>
            <span className="tag">Advisor: {client.advisorId?.name || "Unassigned"}</span>
          </div>
        ))}
        {!clients.length && <div className="panel empty-state">No clients yet.</div>}
      </div>
    </div>
  );
}
