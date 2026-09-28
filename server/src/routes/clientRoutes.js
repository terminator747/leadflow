const express = require("express");
const protect = require("../middleware/auth");

const {
  getClients,
  getMyClient
} = require("../controllers/clientController");

const router = express.Router();

router.get("/", protect, getClients);
router.get("/me", protect, getMyClient);

module.exports = router;
