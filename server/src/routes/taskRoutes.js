const express = require("express");
const protect = require("../middleware/auth");

const {
  getTasks,
  completeTask
} = require("../controllers/taskController");

const router = express.Router();

router.get("/", protect, getTasks);
router.patch("/:id/complete", protect, completeTask);

module.exports = router;
