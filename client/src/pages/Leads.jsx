import { useEffect, useState } from "react";
import { Plus, X, UserRoundPlus } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import useSocket from "../hooks/useSocket";

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  source: "website"
};

export default function Leads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const response = await api.get("/leads");
    setLeads(response.data);
  }

  useEffect(() => {
    load();
  }, []);

  useSocket(user?.brokerageId, {
    leadCreated: load,
    leadUpdated: load
  });

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function createLead(event) {
    event.preventDefault();
    setMessage("");
    setSaving(true);

    try {
      const response = await api.post("/leads", form);
      const duplicate = response.data.duplicate;

      setMessage(
        duplicate
          ? "This person is already known in your brokerage."
          : "Lead created and added to the New stage."
      );

      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Could not create the lead."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header leads-header">
        <div>
          <span className="eyebrow">LEADS</span>
          <h1>All leads</h1>
          <p>Every lead belonging to your brokerage.</p>
        </div>

        {(user?.role === "advisor" || user?.role === "brokerage_admin") && (
          <button
            className="primary-button compact"
            onClick={() => {
              setMessage("");
              setShowForm(true);
            }}
          >
            <Plus size={17} />
            Add new lead
          </button>
        )}
      </div>

      {message && <div className="alert">{message}</div>}

      <div className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Source</th>
              <th>Status</th>
              <th>Advisor</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead._id}>
                <td>
                  <strong>{lead.firstName} {lead.lastName}</strong>
                </td>
                <td>{lead.email}</td>
                <td>{lead.source}</td>
                <td><span className="tag">{lead.status}</span></td>
                <td>{lead.assignedAdvisor?.name || "Unassigned"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {!leads.length && (
          <div className="empty-state">No leads yet.</div>
        )}
      </div>

      {showForm && (
        <div className="modal-backdrop" onMouseDown={() => setShowForm(false)}>
          <div
            className="modal-card lead-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">NEW LEAD</span>
                <h2>Add a lead</h2>
                <p>
                  {user?.role === "advisor"
                    ? "This lead will automatically be assigned to you."
                    : "The lead will be assigned to the first available advisor."}
                </p>
              </div>

              <button
                className="icon-button"
                onClick={() => setShowForm(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form className="form-stack" onSubmit={createLead}>
              <div className="form-grid-two">
                <label>
                  First name
                  <input
                    value={form.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    required
                  />
                </label>

                <label>
                  Last name
                  <input
                    value={form.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                  />
                </label>
              </div>

              <div className="form-grid-two">
                <label>
                  Email
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    required
                  />
                </label>

                <label>
                  Phone
                  <input
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </label>
              </div>

              <label>
                Lead source
                <select
                  value={form.source}
                  onChange={(e) => updateField("source", e.target.value)}
                >
                  <option value="website">Website</option>
                  <option value="partner">Partner</option>
                  <option value="referral">Referral</option>
                  <option value="manual">Manual</option>
                </select>
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button
                  className="primary-button"
                  disabled={saving}
                >
                  <UserRoundPlus size={17} />
                  {saving ? "Creating..." : "Create lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
