import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const stages = ["NEW", "CONTACTED", "QUALIFIED", "DOCUMENTS", "WON", "LOST"];
const blank = {
  name: "",
  subject: "",
  body: "",
  pipelineStage: "NEW",
  enabled: true
};

export default function EmailTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({
    name: "Welcome Email",
    subject: "Welcome {{clientName}}",
    body: "<h2>Welcome {{clientName}}</h2><p>Your advisor is {{advisorName}}.</p>",
    pipelineStage: "NEW",
    enabled: true
  });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  async function load() {
    const response = await api.get("/email-templates");
    setTemplates(response.data);
  }

  useEffect(() => { load(); }, []);

  async function saveTemplate(event) {
    event.preventDefault();
    setMessage("");

    try {
      if (editingId) {
        await api.patch(`/email-templates/${editingId}`, form);
        setMessage("Template updated.");
      } else {
        await api.post("/email-templates", form);
        setMessage("Template created.");
      }

      setEditingId(null);
      setForm(blank);
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not save template.");
    }
  }

  function editTemplate(template) {
    setEditingId(template._id);
    setForm({
      name: template.name,
      subject: template.subject,
      body: template.body,
      pipelineStage: template.pipelineStage,
      enabled: template.enabled
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (user?.role !== "brokerage_admin" && user?.role !== "platform_admin") {
    return <div className="page"><div className="panel empty-state">Email templates are managed by the brokerage admin.</div></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">AUTOMATION</span>
          <h1>Email templates</h1>
          <p>Link messages to pipeline stages with placeholders.</p>
        </div>
      </div>

      {message && <div className="alert">{message}</div>}

      <div className="two-column">
        <form className="panel form-stack" onSubmit={saveTemplate}>
          <h3>{editingId ? "Edit template" : "Create template"}</h3>

          <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>

          <label>Pipeline stage
            <select value={form.pipelineStage} onChange={(e) => setForm({ ...form, pipelineStage: e.target.value })}>
              {stages.map((stage) => <option key={stage}>{stage}</option>)}
            </select>
          </label>

          <label>Subject<input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required /></label>

          <label>Body<textarea rows="7" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required /></label>

          <label className="checkbox-row">
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
            Trigger this template automatically
          </label>

          <div className="placeholder-help">Available: {"{{clientName}}"}, {"{{advisorName}}"}, {"{{brokerageName}}"}, {"{{leadName}}"}</div>

          <div className="modal-actions">
            {editingId && <button type="button" className="ghost-button" onClick={() => { setEditingId(null); setForm(blank); }}>Cancel edit</button>}
            <button className="primary-button">{editingId ? "Save changes" : "Create template"}</button>
          </div>
        </form>

        <div className="template-list">
          {templates.map((template) => (
            <div className="panel template-card" key={template._id}>
              <div className="template-top"><strong>{template.name}</strong><span className="tag">{template.pipelineStage}</span></div>
              <h4>{template.subject}</h4>
              <p>{template.body.replace(/<[^>]*>/g, "")}</p>
              <div className="modal-actions"><span className="tag">{template.enabled ? "Enabled" : "Disabled"}</span><button className="ghost-button" onClick={() => editTemplate(template)}>Edit</button></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
