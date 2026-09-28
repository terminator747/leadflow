const express = require("express");
const protect = require("../middleware/auth");
const allowRoles = require("../middleware/role");

const {
  getLeads,
  createLead,
  updateStatus,
  convertToClient
} = require("../controllers/leadController");

const router = express.Router();

router.get("/", protect, getLeads);
router.post(
  "/",
  protect,
  allowRoles("brokerage_admin", "advisor"),
  createLead
);
router.patch("/:id/status", protect, updateStatus);
router.post("/:id/convert", protect, allowRoles("brokerage_admin", "advisor"), convertToClient);

module.exports = router;
