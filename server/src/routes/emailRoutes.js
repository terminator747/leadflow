const express = require("express");
const protect = require("../middleware/auth");
const allowRoles = require("../middleware/role");

const {
  getTemplates,
  createTemplate,
  updateTemplate
} = require("../controllers/emailController");

const router = express.Router();

router.get("/", protect, getTemplates);
router.post(
  "/",
  protect,
  allowRoles("brokerage_admin"),
  createTemplate
);
router.patch(
  "/:id",
  protect,
  allowRoles("brokerage_admin"),
  updateTemplate
);

module.exports = router;
