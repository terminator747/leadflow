const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const Document = require("../models/Document");
const Client = require("../models/Client");

const uploadsDir = path.join(process.cwd(), "uploads");

function canReviewDocuments(role) {
  return ["advisor", "brokerage_admin"].includes(
    String(role || "").toLowerCase()
  );
}

function getDocumentQuery(user) {
  const role = String(user.role || "").toLowerCase();

  if (role === "client") {
    return Client.findOne({
      userId: user._id,
      brokerageId: user.brokerageId
    }).then((client) => {
      if (!client) return null;

      return {
        clientId: client._id,
        brokerageId: user.brokerageId
      };
    });
  }

  if (role === "platform_admin") {
    return {};
  }

  return { brokerageId: user.brokerageId };
}

async function canAccessDocument(user, document) {
  const role = String(user.role || "").toLowerCase();

  if (role === "platform_admin") {
    return true;
  }

  if (String(document.brokerageId) !== String(user.brokerageId)) {
    return false;
  }

  if (role === "client") {
    const client = await Client.findOne({
      userId: user._id,
      brokerageId: user.brokerageId
    });

    return Boolean(
      client &&
      String(document.clientId) === String(client._id)
    );
  }

  return true;
}

function getStoredFilePath(fileUrl) {
  const filename = path.basename(fileUrl || "");

  if (!filename) return null;

  const filePath = path.resolve(uploadsDir, filename);
  const safeDirectory = path.resolve(uploadsDir) + path.sep;

  if (!filePath.startsWith(safeDirectory)) {
    return null;
  }

  return filePath;
}

async function uploadDocument(req, res) {
  let savedFilePath;

  try {
    if (String(req.user.role || "").toLowerCase() !== "client") {
      return res.status(403).json({
        message: "Only clients can upload documents"
      });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        message: "No file uploaded"
      });
    }

    const client = await Client.findOne({
      userId: req.user._id,
      brokerageId: req.user.brokerageId
    });

    if (!client) {
      return res.status(404).json({
        message: "Client profile not found"
      });
    }

    await fs.promises.mkdir(uploadsDir, { recursive: true });

    const extension = path.extname(req.file.originalname || "").toLowerCase();
    const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];

    if (!allowedExtensions.includes(extension)) {
      return res.status(400).json({
        message: "Unsupported document file type"
      });
    }

    const filename = `${crypto.randomUUID()}${extension}`;
    savedFilePath = path.join(uploadsDir, filename);

    await fs.promises.writeFile(savedFilePath, req.file.buffer);

    const document = await Document.create({
      brokerageId: req.user.brokerageId,
      clientId: client._id,
      name: req.file.originalname,
      fileUrl: `/uploads/${filename}`,
      publicId: null,
      status: "PROCESSING"
    });

    const populatedDocument = await Document.findById(document._id)
      .populate("clientId", "firstName lastName email");

    const io = req.app.get("io");

    if (io) {
      io.to(`brokerage:${req.user.brokerageId}`).emit(
        "documentUpdated",
        populatedDocument
      );
    }

    return res.status(201).json(populatedDocument);
  } catch (error) {
    if (savedFilePath) {
      await fs.promises.unlink(savedFilePath).catch(() => {});
    }

    console.error("Upload document error:", error);

    return res.status(500).json({
      message: "Failed to upload document",
      error: error.message
    });
  }
}

async function getDocuments(req, res) {
  try {
    const query = await getDocumentQuery(req.user);

    if (!query) {
      return res.json([]);
    }

    const documents = await Document.find(query)
      .populate("clientId", "firstName lastName email")
      .sort({ createdAt: -1 });

    return res.json(documents);
  } catch (error) {
    console.error("Get documents error:", error);

    return res.status(500).json({
      message: "Failed to load documents",
      error: error.message
    });
  }
}

async function viewDocument(req, res) {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        message: "Document not found"
      });
    }

    const allowed = await canAccessDocument(req.user, document);

    if (!allowed) {
      return res.status(403).json({
        message: "You are not allowed to view this document"
      });
    }

    const filePath = getStoredFilePath(document.fileUrl);

    if (!filePath) {
      return res.status(400).json({
        message: "Invalid document file path"
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "Document file is missing from storage"
      });
    }

    const extension = path.extname(filePath).toLowerCase();

    const contentTypes = {
      ".pdf": "application/pdf",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp"
    };

    res.setHeader(
      "Content-Type",
      contentTypes[extension] || "application/octet-stream"
    );
    res.setHeader("Content-Disposition", "inline");

    return res.sendFile(filePath);
  } catch (error) {
    console.error("View document error:", error);

    return res.status(500).json({
      message: "Failed to open document",
      error: error.message
    });
  }
}

async function updateDocumentStatus(req, res) {
  try {
    const role = String(req.user.role || "").toLowerCase();

    if (!canReviewDocuments(role)) {
      return res.status(403).json({
        message: "Only advisors and brokerage admins can review documents"
      });
    }

    const { status } = req.body;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        message: "Status must be APPROVED or REJECTED"
      });
    }

    const document = await Document.findOneAndUpdate(
      {
        _id: req.params.id,
        brokerageId: req.user.brokerageId
      },
      { status },
      { new: true, runValidators: true }
    ).populate("clientId", "firstName lastName email");

    if (!document) {
      return res.status(404).json({
        message: "Document not found in your brokerage"
      });
    }

    const io = req.app.get("io");

    if (io) {
      io.to(`brokerage:${document.brokerageId}`).emit(
        "documentUpdated",
        document
      );
    }

    return res.json(document);
  } catch (error) {
    console.error("Update document status error:", error);

    return res.status(500).json({
      message: "Failed to update document",
      error: error.message
    });
  }
}

module.exports = {
  uploadDocument,
  getDocuments,
  viewDocument,
  updateDocumentStatus
};