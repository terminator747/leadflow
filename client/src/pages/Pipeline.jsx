import { useCallback, useEffect, useState } from "react";
import { RefreshCw, UserPlus, Copy, X } from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import useSocket from "../hooks/useSocket";

const stages = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "DOCUMENTS",
  "WON",
  "LOST"
];

const labels = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  DOCUMENTS: "Documents",
  WON: "Won",
  LOST: "Lost"
};

export default function Pipeline() {
  const { user } = useAuth();

  const [leads, setLeads] = useState([]);
  const [message, setMessage] = useState("");

  const [clientCredentials, setClientCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await api.get("/leads");
      setLeads(response.data);
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
          "Could not load the pipeline."
      );
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateLead = useCallback((updated) => {
    setLeads((previous) => {
      const exists = previous.some(
        (lead) => lead._id === updated._id
      );

      return exists
        ? previous.map((lead) =>
            lead._id === updated._id ? updated : lead
          )
        : [updated, ...previous];
    });
  }, []);

  useSocket(user?.brokerageId, {
    leadCreated: updateLead,
    leadUpdated: updateLead
  });

  async function moveLead(lead, status) {
    if (lead.status === status) return;

    try {
      setMessage("");

      const response = await api.patch(
        `/leads/${lead._id}/status`,
        {
          status,
          version: lead.version
        }
      );

      updateLead(response.data);
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
          "Could not move the lead."
      );

      await load();
    }
  }

  async function convertLeadToClient(lead) {
    try {
      setMessage("");

      const response = await api.post(
        `/leads/${lead._id}/convert`
      );

      /*
       * If the backend created a brand-new client account,
       * temporaryPassword will be present.
       */
      if (response.data.temporaryPassword) {
        setClientCredentials({
          name:
            response.data.user?.name ||
            `${lead.firstName} ${lead.lastName}`.trim(),

          email:
            response.data.user?.email ||
            lead.email,

          password:
            response.data.temporaryPassword
        });

        setCopied(false);
      } else {
        /*
         * This happens when the client account already existed
         * or the lead had already been converted.
         */
        alert(
          response.data.message ||
            "Client created, but no new temporary password was generated."
        );
      }

      await load();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Conversion failed"
      );
    }
  }

  async function copyPassword() {
    if (!clientCredentials?.password) return;

    try {
      await navigator.clipboard.writeText(
        clientCredentials.password
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Could not copy password:", error);
    }
  }

  function closeCredentials() {
    setClientCredentials(null);
    setCopied(false);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">CRM PIPELINE</span>

          <h1>Lead pipeline</h1>

          <p>
            Move leads through the mortgage journey.
          </p>
        </div>

        <button
          className="ghost-button"
          onClick={load}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {message && (
        <div className="alert error">
          {message}
        </div>
      )}

      <div className="pipeline">
        {stages.map((stage) => {
          const stageLeads = leads.filter(
            (lead) => lead.status === stage
          );

          return (
            <div
              className="pipeline-column"
              key={stage}
            >
              <div className="column-header">
                <div>
                  <span
                    className={`stage-dot ${stage.toLowerCase()}`}
                  />

                  <strong>
                    {labels[stage]}
                  </strong>
                </div>

                <span className="count-badge">
                  {stageLeads.length}
                </span>
              </div>

              <div className="lead-list">
                {stageLeads.map((lead) => (
                  <article
                    className="lead-card"
                    key={lead._id}
                  >
                    <div className="lead-top">
                      <div className="avatar small">
                        {lead.firstName
                          .slice(0, 1)
                          .toUpperCase()}
                      </div>

                      <div>
                        <strong>
                          {lead.firstName}{" "}
                          {lead.lastName}
                        </strong>

                        <span>
                          {lead.email}
                        </span>
                      </div>
                    </div>

                    <div className="lead-meta">
                      <span>
                        {lead.source}
                      </span>

                      {lead.isDuplicate && (
                        <span className="tag warning">
                          Known person
                        </span>
                      )}
                    </div>

                    <div className="move-row">
                      <select
                        value={lead.status}
                        onChange={(e) =>
                          moveLead(
                            lead,
                            e.target.value
                          )
                        }
                      >
                        {stages.map((option) => (
                          <option
                            value={option}
                            key={option}
                          >
                            {labels[option]}
                          </option>
                        ))}
                      </select>

                      <button
                        className="icon-button"
                        title="Convert to client"
                        onClick={() =>
                          convertLeadToClient(
                            lead
                          )
                        }
                      >
                        <UserPlus size={16} />
                      </button>
                    </div>
                  </article>
                ))}

                {!stageLeads.length && (
                  <div className="empty-column">
                    No leads
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CLIENT CREDENTIALS MODAL */}

      {clientCredentials && (
        <div className="credentials-overlay">
          <div className="credentials-modal">
            <button
              className="credentials-close"
              onClick={closeCredentials}
              title="Close"
            >
              <X size={18} />
            </button>

            <div className="credentials-icon">
              <UserPlus size={24} />
            </div>

            <span className="eyebrow">
              CLIENT ACCOUNT
            </span>

            <h2>
              Client created successfully
            </h2>

            <p className="credentials-description">
              Give these login credentials to
              the client securely.
            </p>

            <div className="credential-row">
              <span className="credential-label">
                Client
              </span>

              <strong>
                {clientCredentials.name}
              </strong>
            </div>

            <div className="credential-row">
              <span className="credential-label">
                Email
              </span>

              <strong>
                {clientCredentials.email}
              </strong>
            </div>

            <div className="credential-password">
              <span className="credential-label">
                Temporary password
              </span>

              <div className="password-box">
                <code>
                  {clientCredentials.password}
                </code>

                <button
                  type="button"
                  onClick={copyPassword}
                  className="copy-password"
                  title="Copy password"
                >
                  <Copy size={16} />

                  {copied
                    ? "Copied"
                    : "Copy"}
                </button>
              </div>
            </div>

            <div className="credentials-warning">
              Save this password now. It will not
              be shown again after this window is
              closed.
            </div>

            <button
              className="primary-button credentials-done"
              onClick={closeCredentials}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}