import { useEffect, useState } from "react";
import { Plus, Save } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const stages = ["NEW", "CONTACTED", "QUALIFIED", "DOCUMENTS", "WON", "LOST"];

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [rules, setRules] = useState([]);
  const [ruleForm, setRuleForm] = useState({
    pipelineStage: "NEW",
    title: "Call within 2 hours",
    dueInHours: 2
  });

  async function load() {
    const response = await api.get("/tasks");
    setTasks(response.data);

    if (user?.role === "brokerage_admin") {
      const ruleResponse = await api.get("/task-rules");
      setRules(ruleResponse.data);
    }
  }

  useEffect(() => {
    load();
  }, [user?.role]);

  async function complete(id) {
    await api.patch(`/tasks/${id}/complete`);
    load();
  }

  async function createRule(event) {
    event.preventDefault();
    await api.post("/task-rules", {
      ...ruleForm,
      dueInHours: Number(ruleForm.dueInHours)
    });
    setRuleForm({ pipelineStage: "NEW", title: "", dueInHours: 24 });
    load();
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">TASKS</span>
          <h1>Advisor tasks</h1>
          <p>Tasks created by pipeline triggers.</p>
        </div>
      </div>

      {user?.role === "brokerage_admin" && (
        <section className="panel panel-modern" style={{ marginBottom: 20 }}>
          <div className="panel-heading">
            <div>
              <span className="eyebrow">AUTOMATION</span>
              <h3>Pipeline task rules</h3>
            </div>
          </div>

          <form className="form-grid-two" onSubmit={createRule}>
            <label>
              Pipeline stage
              <select value={ruleForm.pipelineStage} onChange={(e) => setRuleForm({ ...ruleForm, pipelineStage: e.target.value })}>
                {stages.map((stage) => <option key={stage}>{stage}</option>)}
              </select>
            </label>
            <label>
              Task title
              <input value={ruleForm.title} onChange={(e) => setRuleForm({ ...ruleForm, title: e.target.value })} placeholder="Request bank statement" required />
            </label>
            <label>
              Due in hours
              <input type="number" min="1" value={ruleForm.dueInHours} onChange={(e) => setRuleForm({ ...ruleForm, dueInHours: e.target.value })} required />
            </label>
            <div style={{ display: "flex", alignItems: "end" }}>
              <button className="primary-button compact"><Plus size={16} /> Add trigger</button>
            </div>
          </form>

          <div className="task-list" style={{ marginTop: 18 }}>
            {rules.map((rule) => (
              <div className="panel task-row" key={rule._id}>
                <div>
                  <strong>{rule.title}</strong>
                  <span>{rule.pipelineStage} · due in {rule.dueInHours}h</span>
                </div>
                <span className="tag">{rule.enabled ? "Enabled" : "Disabled"}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="task-list">
        {tasks.map((task) => {
          const overdue = task.status === "PENDING" && new Date(task.dueDate) < new Date();

          return (
            <div className={`panel task-row ${overdue ? "overdue" : ""}`} key={task._id}>
              <div>
                <strong>{task.title}</strong>
                <span>{task.leadId ? `${task.leadId.firstName} ${task.leadId.lastName || ""}` : "No lead"}</span>
              </div>
              <div>
                <span className={overdue ? "danger-text" : "muted"}>Due {new Date(task.dueDate).toLocaleString()}</span>
                <span>{task.assignedTo?.name || "Unassigned"}</span>
              </div>
              {task.status === "PENDING" ? (
                <button className="secondary-button" onClick={() => complete(task._id)}>
                  <Save size={15} /> Complete
                </button>
              ) : (
                <span className="status-pill approved">Completed</span>
              )}
            </div>
          );
        })}

        {!tasks.length && <div className="panel empty-state">No tasks yet. Move a lead into a trigger stage.</div>}
      </div>
    </div>
  );
}
