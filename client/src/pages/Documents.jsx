import { useCallback, useEffect, useState } from "react";
import {
  FileCheck2,
  FileText,
  UploadCloud,
  RefreshCw,
  Eye,
  Check,
  X
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import useSocket from "../hooks/useSocket";

export default function Documents() {
  const { user } = useAuth();

  const role = String(user?.role || "").toLowerCase();
  const isClient = role === "client";
  const canReview = ["advisor", "brokerage_admin"].includes(role);

  const [documents, setDocuments] = useState([]);
  const [client, setClient] = useState(null);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busyDocumentId, setBusyDocumentId] = useState(null);

  const load = useCallback(async () => {
    try {
      setMessage("");

      const docsResponse = await api.get("/documents");
      setDocuments(docsResponse.data);

      if (isClient) {
        const clientResponse = await api.get("/clients/me");
        setClient(clientResponse.data);
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not load documents."
      );
    }
  }, [isClient]);

  useEffect(() => {
    load();
  }, [load]);

  const updateDocument = useCallback((updated) => {
    setDocuments((previous) => {
      const exists = previous.some(
        (document) => document._id === updated._id
      );

      if (exists) {
        return previous.map((document) =>
          document._id === updated._id ? updated : document
        );
      }

      return [updated, ...previous];
    });
  }, []);

  useSocket(user?.brokerageId, {
    documentUpdated: updateDocument
  });

  async function upload() {
    if (!file) {
      setMessage("Please choose a document first.");
      return;
    }

    if (!client?._id) {
      setMessage("Your client profile could not be found.");
      return;
    }

    try {
      setUploading(true);
      setMessage("");

      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/documents", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      updateDocument(response.data);
      setFile(null);

      const input = document.getElementById("document-file");

      if (input) {
        input.value = "";
      }

      setMessage("Document uploaded successfully.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function viewDocument(doc) {
    let previewWindow = null;

    try {
      setMessage("");

      // Open the tab immediately so the browser does not block it.
      previewWindow = window.open("", "_blank");

      const response = await api.get(
        `/documents/${doc._id}/view`,
        { responseType: "blob" }
      );

      const fileBlob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/octet-stream"
      });

      const fileUrl = URL.createObjectURL(fileBlob);

      if (previewWindow) {
        previewWindow.location.href = fileUrl;
      } else {
        const link = document.createElement("a");
        link.href = fileUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.click();
      }

      // Revoke the temporary browser URL after a reasonable viewing period.
      window.setTimeout(() => URL.revokeObjectURL(fileUrl), 60000);
    } catch (error) {
      if (previewWindow) {
        previewWindow.close();
      }

      setMessage(
        error.response?.data?.message || "Could not open this document."
      );
    }
  }

  async function reviewDocument(doc, status) {
    try {
      setBusyDocumentId(doc._id);
      setMessage("");

      const response = await api.patch(
        `/documents/${doc._id}/status`,
        { status }
      );

      updateDocument(response.data);
      setMessage(`Document marked ${status.toLowerCase()}.`);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not update document status."
      );
    } finally {
      setBusyDocumentId(null);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">DOCUMENTS</span>

          <h1>{isClient ? "My documents" : "Document center"}</h1>

          <p>
            {isClient
              ? "Upload and view the documents for your mortgage case."
              : "View client documents and review their verification status."}
          </p>
        </div>

        <button className="ghost-button" onClick={load}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {isClient ? (
        <div className="document-upload panel">
          <div className="document-upload-copy">
            <FileCheck2 size={25} />

            <div>
              <strong>Upload a case document</strong>
              <span>PDF, JPG, PNG or WEBP · maximum 10 MB</span>
            </div>
          </div>

          <label className="file-picker">
            <UploadCloud size={24} />

            <span>
              {file ? file.name : "Choose a document"}
            </span>

            <input
              id="document-file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(event) =>
                setFile(event.target.files?.[0] || null)
              }
            />
          </label>

          <button
            className="primary-button compact"
            onClick={upload}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload document"}
          </button>
        </div>
      ) : (
        <div className="panel info-banner">
          <FileCheck2 size={20} />

          <span>
            {canReview
              ? "You can view documents and approve or reject them."
              : "You can view documents. Document approval and rejection are restricted to advisors and brokerage admins."}
          </span>
        </div>
      )}

      {message && (
        <div className="alert" role="status">
          {message}
        </div>
      )}

      <div className="document-list">
        {documents.map((doc) => {
          const status = String(doc.status || "UPLOADED").toLowerCase();
          const isBusy = busyDocumentId === doc._id;

          return (
            <div className="panel document-row" key={doc._id}>
              <div className="file-icon">
                <FileText size={20} />
              </div>

              <div className="document-info">
                <strong>{doc.name}</strong>

                <span>
                  {doc.clientId?.firstName
                    ? `${doc.clientId.firstName} ${doc.clientId.lastName || ""}`
                    : "My document"}
                </span>
              </div>

              <span className={`status-pill ${status}`}>
                {doc.status}
              </span>

              <div className="document-actions">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => viewDocument(doc)}
                  title="View document"
                >
                  <Eye size={16} />
                  View
                </button>

                {canReview && (
                  <>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => reviewDocument(doc, "APPROVED")}
                      disabled={isBusy || doc.status === "APPROVED"}
                      title="Approve document"
                    >
                      <Check size={16} />
                      Approve
                    </button>

                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => reviewDocument(doc, "REJECTED")}
                      disabled={isBusy || doc.status === "REJECTED"}
                      title="Reject document"
                    >
                      <X size={16} />
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {!documents.length && (
          <div className="panel empty-state">
            No documents uploaded yet.
          </div>
        )}
      </div>
    </div>
  );
}