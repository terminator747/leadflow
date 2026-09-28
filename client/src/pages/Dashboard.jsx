import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  Target,
  TrendingUp,
  Users,
  XCircle
} from "lucide-react";

import api from "../services/api";
import useSocket from "../hooks/useSocket";
import { useAuth } from "../context/AuthContext";

const pipeline = [
  {
    key: "NEW",
    label: "New",
    description: "Fresh leads"
  },
  {
    key: "CONTACTED",
    label: "Contacted",
    description: "First contact made"
  },
  {
    key: "QUALIFIED",
    label: "Qualified",
    description: "Ready to progress"
  },
  {
    key: "DOCUMENTS",
    label: "Documents",
    description: "Awaiting paperwork"
  },
  {
    key: "WON",
    label: "Won",
    description: "Converted clients"
  },
  {
    key: "LOST",
    label: "Lost",
    description: "Closed without conversion"
  }
];

export default function Dashboard() {
  const { user } = useAuth();

  const [data, setData] = useState({
    NEW: 0,
    CONTACTED: 0,
    QUALIFIED: 0,
    DOCUMENTS: 0,
    WON: 0,
    LOST: 0,
    totalLeads: 0,
    overdueTasks: 0,
    documents: {
      total: 0,
      processing: 0,
      approved: 0,
      rejected: 0
    }
  });

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboard = useCallback(async () => {
    try {
      const response = await api.get("/dashboard");

      setData(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Dashboard load error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleLeadCreated = useCallback(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleLeadUpdated = useCallback(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleDocumentUpdated = useCallback(() => {
    loadDashboard();
  }, [loadDashboard]);

  useSocket(user?.brokerageId, {
    leadCreated: handleLeadCreated,
    leadUpdated: handleLeadUpdated,
    documentUpdated: handleDocumentUpdated
  });

  const totalPipeline = Math.max(
    data.NEW +
      data.CONTACTED +
      data.QUALIFIED +
      data.DOCUMENTS +
      data.WON +
      data.LOST,
    1
  );

  if (loading) {
    return (
      <section className="page dashboard-page">
        <div className="loading-state">
          Loading dashboard...
        </div>
      </section>
    );
  }

  return (
    <section className="page dashboard-page">
      <div className="dashboard-hero">
        <div>
          <div className="eyebrow">
            <Activity size={14} />
            LIVE WORKSPACE
          </div>

          <h1>
            Good to see you,{" "}
            {user?.name?.split(" ")[0] || "there"}.
          </h1>

          <p>
            Monitor your leads, documents and client
            workflow from one place.
          </p>
        </div>

        <div className="dashboard-hero-meta">
          <div className="hero-live-dot" />
          <span>
            Live updates enabled
          </span>

          {lastUpdated && (
            <small>
              Updated{" "}
              {lastUpdated.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              })}
            </small>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={20} />
          </div>

          <span>Total Leads</span>
          <strong>{data.totalLeads}</strong>

          <small>
            Across your pipeline
          </small>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Target size={20} />
          </div>

          <span>Qualified</span>
          <strong>{data.QUALIFIED}</strong>

          <small>
            Ready for next step
          </small>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FileText size={20} />
          </div>

          <span>Documents</span>
          <strong>{data.documents.total}</strong>

          <small>
            Uploaded documents
          </small>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Clock3 size={20} />
          </div>

          <span>Processing</span>
          <strong>{data.documents.processing}</strong>

          <small>
            Documents being checked
          </small>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircle2 size={20} />
          </div>

          <span>Approved</span>
          <strong>{data.documents.approved}</strong>

          <small>
            Documents approved
          </small>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Clock3 size={20} />
          </div>

          <span>Overdue Tasks</span>
          <strong>{data.overdueTasks}</strong>

          <small>
            Need your attention
          </small>
        </div>
      </div>

      <div className="dashboard-main-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">
                PIPELINE
              </span>

              <h2>Lead progression</h2>
            </div>

            <a href="/pipeline" className="panel-link">
              Open pipeline
              <ArrowUpRight size={16} />
            </a>
          </div>

          <div className="pipeline-list">
            {pipeline.map((item) => {
              const value = data[item.key] || 0;

              const percentage =
                Math.round(
                  (value / totalPipeline) * 100
                );

              return (
                <div
                  className="pipeline-row"
                  key={item.key}
                >
                  <div className="pipeline-row-info">
                    <strong>
                      {item.label}
                    </strong>

                    <span>
                      {item.description}
                    </span>
                  </div>

                  <div className="pipeline-bar">
                    <div
                      style={{
                        width: `${percentage}%`
                      }}
                    />
                  </div>

                  <strong className="pipeline-value">
                    {value}
                  </strong>
                </div>
              );
            })}
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">
                DOCUMENT WORKFLOW
              </span>

              <h2>Case paperwork</h2>
            </div>

            <FileCheck2 size={20} />
          </div>

          <div className="document-workflow-grid">
            <div className="workflow-stat processing">
              <Clock3 size={18} />
              <span>Processing</span>
              <strong>
                {data.documents.processing}
              </strong>
            </div>

            <div className="workflow-stat approved">
              <CheckCircle2 size={18} />
              <span>Approved</span>
              <strong>
                {data.documents.approved}
              </strong>
            </div>

            <div className="workflow-stat rejected">
              <XCircle size={18} />
              <span>Rejected</span>
              <strong>
                {data.documents.rejected}
              </strong>
            </div>

            <div className="workflow-stat total">
              <FileText size={18} />
              <span>Total</span>
              <strong>
                {data.documents.total}
              </strong>
            </div>
          </div>

          <div className="dashboard-insight">
            <TrendingUp size={18} />

            <div>
              <strong>
                {data.documents.processing > 0
                  ? "Documents need review"
                  : "Document workflow is clear"}
              </strong>

              <span>
                {data.documents.processing > 0
                  ? `${data.documents.processing} document${
                      data.documents.processing === 1
                        ? ""
                        : "s"
                    } currently processing.`
                  : "No documents are currently waiting for automated checks."}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}