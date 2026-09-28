import { useCallback, useEffect, useState } from "react";
import {
  UserRound,
  FileText,
  Clock3,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import useSocket from "../hooks/useSocket";

export default function ClientDashboard() {
  const { user } = useAuth();

  const [client, setClient] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      setMessage("");

      const [clientResponse, documentsResponse] =
        await Promise.all([
          api.get("/clients/me"),
          api.get("/documents")
        ]);

      setClient(clientResponse.data);
      setDocuments(documentsResponse.data);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Could not load your case."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateDocument = useCallback((updated) => {
    setDocuments((previous) => {
      const exists = previous.some(
        (document) =>
          document._id === updated._id
      );

      if (exists) {
        return previous.map((document) =>
          document._id === updated._id
            ? updated
            : document
        );
      }

      return [updated, ...previous];
    });
  }, []);

  useSocket(user?.brokerageId, {
    documentUpdated: updateDocument
  });

  if (loading) {
    return (
      <div className="page">
        <div className="loading">
          Loading your case...
        </div>
      </div>
    );
  }

  const approved = documents.filter(
    (document) =>
      document.status === "APPROVED"
  ).length;

  const processing = documents.filter(
    (document) =>
      document.status === "PROCESSING"
  ).length;

  const rejected = documents.filter(
    (document) =>
      document.status === "REJECTED"
  ).length;

  const total = documents.length;

  const firstName =
    client?.firstName ||
    user?.name?.split(" ")[0] ||
    "there";

  return (
    <div className="page client-dashboard">
      <section className="client-hero">
        <div>
          <span className="eyebrow">
            CLIENT PORTAL
          </span>

          <h1>
            Welcome, {firstName}
          </h1>

          <p>
            Here's the current status of your
            mortgage case.
          </p>
        </div>

        <div className="client-status-badge">
          <span className="status-dot" />
          Case active
        </div>
      </section>

      {message && (
        <div className="alert error">
          {message}
        </div>
      )}

      <div className="client-summary-grid">
        <div className="panel client-summary-card">
          <div className="client-summary-icon">
            <FileText size={20} />
          </div>

          <div>
            <span>Documents</span>
            <strong>{total}</strong>
          </div>
        </div>

        <div className="panel client-summary-card">
          <div className="client-summary-icon approved">
            <CheckCircle2 size={20} />
          </div>

          <div>
            <span>Approved</span>
            <strong>{approved}</strong>
          </div>
        </div>

        <div className="panel client-summary-card">
          <div className="client-summary-icon processing">
            <Clock3 size={20} />
          </div>

          <div>
            <span>Processing</span>
            <strong>{processing}</strong>
          </div>
        </div>

        <div className="panel client-summary-card">
          <div className="client-summary-icon rejected">
            <AlertCircle size={20} />
          </div>

          <div>
            <span>Needs attention</span>
            <strong>{rejected}</strong>
          </div>
        </div>
      </div>

      <div className="client-dashboard-grid">
        <section className="panel client-case-card">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">
                MY CASE
              </span>

              <h3>
                Mortgage application
              </h3>
            </div>
          </div>

          <div className="client-case-details">
            <div>
              <span>Client</span>
              <strong>
                {client?.firstName}{" "}
                {client?.lastName}
              </strong>
            </div>

            <div>
              <span>Email</span>
              <strong>
                {client?.email}
              </strong>
            </div>

            <div>
              <span>Phone</span>
              <strong>
                {client?.phone || "Not provided"}
              </strong>
            </div>

            <div>
              <span>Advisor</span>
              <strong>
                {client?.advisorId?.name ||
                  "Your advisor"}
              </strong>
            </div>

            <div>
              <span>Advisor email</span>
              <strong>
                {client?.advisorId?.email ||
                  "Not available"}
              </strong>
            </div>
          </div>
        </section>

        <section className="panel client-next-card">
          <div className="client-next-icon">
            <ArrowRight size={20} />
          </div>

          <span className="eyebrow">
            NEXT STEP
          </span>

          <h3>
            Upload your documents
          </h3>

          <p>
            Upload your requested payslips,
            identification, bank statements and
            other case documents. Each document
            is checked in the background.
          </p>

          <a
            href="/documents"
            className="primary-button"
          >
            Open Documents
            <ArrowRight size={16} />
          </a>
        </section>
      </div>

      <section className="panel client-document-summary">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">
              DOCUMENT STATUS
            </span>

            <h3>
              Recent documents
            </h3>
          </div>

          <a
            href="/documents"
            className="text-link"
          >
            View all
            <ArrowRight size={14} />
          </a>
        </div>

        {documents.length === 0 ? (
          <div className="empty-state">
            You haven't uploaded any documents yet.
          </div>
        ) : (
          <div className="client-document-list">
            {documents
              .slice(0, 5)
              .map((document) => (
                <div
                  className="client-document-item"
                  key={document._id}
                >
                  <div className="client-document-name">
                    <FileText size={17} />

                    <div>
                      <strong>
                        {document.name}
                      </strong>

                      <span>
                        {new Date(
                          document.createdAt
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`status-pill ${document.status.toLowerCase()}`}
                  >
                    {document.status}
                  </span>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}