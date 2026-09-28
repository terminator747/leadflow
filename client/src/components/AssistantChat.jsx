import { useEffect, useRef, useState } from "react";
import { Bot, ChevronDown, MessageCircle, Send, X, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const quickActions = [
  "How many leads do I have?",
  "Show my pipeline",
  "What tasks are due?"
];

function getReply(message, { dashboard, leads, tasks }) {
  const text = message.toLowerCase();

  if (text.includes("lead") && (text.includes("how many") || text.includes("total"))) {
    return `You currently have ${dashboard?.totalLeads ?? leads.length} leads in your brokerage.`;
  }

  if (text.includes("pipeline") || text.includes("stage")) {
    const stages = [
      ["New", dashboard?.NEW ?? 0],
      ["Contacted", dashboard?.CONTACTED ?? 0],
      ["Qualified", dashboard?.QUALIFIED ?? 0],
      ["Documents", dashboard?.DOCUMENTS ?? 0],
      ["Won", dashboard?.WON ?? 0],
      ["Lost", dashboard?.LOST ?? 0]
    ];
    return `Pipeline: ${stages.map(([name, count]) => `${name} ${count}`).join(" · ")}.`;
  }

  if (text.includes("task") || text.includes("due") || text.includes("overdue")) {
    const pending = tasks.filter((task) => task.status === "PENDING");
    const overdue = pending.filter((task) => new Date(task.dueDate) < new Date());
    return `You have ${pending.length} pending task${pending.length === 1 ? "" : "s"}, including ${overdue.length} overdue.`;
  }

  if (text.includes("qualified")) {
    return `There are ${dashboard?.QUALIFIED ?? 0} qualified leads right now.`;
  }

  if (text.includes("won")) {
    return `You have ${dashboard?.WON ?? 0} won leads.`;
  }

  if (text.includes("client")) {
    return "I can help you navigate to Clients. Use the Clients shortcut below or the sidebar.";
  }

  return "I can help with leads, pipeline stages and tasks. Try asking: “How many leads do I have?”";
}

export default function AssistantChat() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      text: "Hi! I’m your LeadFlow assistant. I can quickly check your leads, pipeline and tasks."
    }
  ]);
  const [snapshot, setSnapshot] = useState({ dashboard: null, leads: [], tasks: [] });
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    let active = true;
    Promise.allSettled([api.get("/dashboard"), api.get("/leads"), api.get("/tasks")]).then((results) => {
      if (!active) return;
      setSnapshot({
        dashboard: results[0].status === "fulfilled" ? results[0].value.data : null,
        leads: results[1].status === "fulfilled" ? results[1].value.data : [],
        tasks: results[2].status === "fulfilled" ? results[2].value.data : []
      });
    });

    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function send(text = message) {
    const clean = text.trim();
    if (!clean || sending) return;

    setSending(true);
    setMessage("");
    setMessages((current) => [
      ...current,
      { id: Date.now(), role: "user", text: clean }
    ]);

    const reply = getReply(clean, snapshot);

    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, role: "assistant", text: reply }
      ]);
      setSending(false);
    }, 350);
  }

  return (
    <>
      {open && (
        <section className="assistant-window" aria-label="LeadFlow assistant">
          <header className="assistant-header">
            <div className="assistant-title">
              <div className="assistant-icon"><Sparkles size={16} /></div>
              <div>
                <strong>LeadFlow Assistant</strong>
                <span><i /> Online</span>
              </div>
            </div>
            <button className="assistant-close" onClick={() => setOpen(false)} aria-label="Close chat">
              <X size={17} />
            </button>
          </header>

          <div className="assistant-messages">
            {messages.map((item) => (
              <div key={item.id} className={`chat-message ${item.role}`}>
                {item.role === "assistant" && <Bot size={14} />}
                <span>{item.text}</span>
              </div>
            ))}
            {sending && (
              <div className="chat-message assistant typing">
                <Bot size={14} />
                <span>Checking LeadFlow…</span>
              </div>
            )}
          </div>

          <div className="assistant-shortcuts">
            {quickActions.map((action) => (
              <button key={action} onClick={() => send(action)}>{action}</button>
            ))}
            <button onClick={() => navigate("/leads")}>Open leads</button>
            <button onClick={() => navigate("/tasks")}>Open tasks</button>
          </div>

          <form
            className="assistant-input"
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
          >
            <input
              ref={inputRef}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ask about your CRM..."
              aria-label="Ask LeadFlow assistant"
            />
            <button type="submit" aria-label="Send message" disabled={!message.trim() || sending}>
              <Send size={16} />
            </button>
          </form>
        </section>
      )}

      <button
        className={`assistant-fab ${open ? "is-open" : ""}`}
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close assistant" : "Open LeadFlow assistant"}
      >
        {open ? <ChevronDown size={20} /> : <MessageCircle size={21} />}
        {!open && <span className="assistant-badge">BOT</span>}
      </button>
    </>
  );
}
