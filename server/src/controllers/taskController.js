const Task = require("../models/Task");

async function getTasks(req, res) {
  try {
    const query =
      req.user.role === "platform_admin"
        ? {}
        : { brokerageId: req.user.brokerageId };

    if (req.user.role === "advisor") {
      query.assignedTo = req.user._id;
    }

    const tasks = await Task.find(query)
      .populate("assignedTo", "name email")
      .populate("leadId", "firstName lastName email status")
      .sort({ dueDate: 1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function completeTask(req, res) {
  try {
    const filter = {
      _id: req.params.id
    };

    if (req.user.role !== "platform_admin") {
      filter.brokerageId = req.user.brokerageId;
    }

    const task = await Task.findOneAndUpdate(
      filter,
      { status: "COMPLETED" },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({
        message: "Task not found"
      });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getTasks,
  completeTask
};
