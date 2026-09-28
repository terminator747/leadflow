const express = require("express");
const protect = require("../middleware/auth");
const allowRoles = require("../middleware/role");
const {
  getRules,
  createRule,
  updateRule
} = require("../controllers/taskRuleController");

const router = express.Router();

router.get("/", protect, allowRoles("brokerage_admin"), getRules);
router.post("/", protect, allowRoles("brokerage_admin"), createRule);
router.patch("/:id", protect, allowRoles("brokerage_admin"), updateRule);

module.exports = router;
