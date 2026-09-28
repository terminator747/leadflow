const express = require("express");

const protect = require("../middleware/auth");
const upload = require("../middleware/upload");

const {
  uploadDocument,
  getDocuments,
  viewDocument,
  updateDocumentStatus
} = require("../controllers/documentController");

const router = express.Router();

router.get("/", protect, getDocuments);

router.post(
  "/",
  protect,
  upload.single("file"),
  uploadDocument
);

router.get("/:id/view", protect, viewDocument);

router.patch(
  "/:id/status",
  protect,
  updateDocumentStatus
);

module.exports = router;