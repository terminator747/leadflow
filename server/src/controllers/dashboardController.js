const Lead = require("../models/Lead");
const Task = require("../models/Task");
const Document = require("../models/Document");

async function getDashboard(req, res) {
  try {
    const query =
      req.user.role === "platform_admin"
        ? {}
        : { brokerageId: req.user.brokerageId };

    const [
      newLeads,
      contactedLeads,
      qualifiedLeads,
      documentLeads,
      wonLeads,
      lostLeads,
      totalLeads,
      overdueTasks,
      totalDocuments,
      processingDocuments,
      approvedDocuments,
      rejectedDocuments
    ] = await Promise.all([
      Lead.countDocuments({
        ...query,
        status: "NEW"
      }),

      Lead.countDocuments({
        ...query,
        status: "CONTACTED"
      }),

      Lead.countDocuments({
        ...query,
        status: "QUALIFIED"
      }),

      Lead.countDocuments({
        ...query,
        status: "DOCUMENTS"
      }),

      Lead.countDocuments({
        ...query,
        status: "WON"
      }),

      Lead.countDocuments({
        ...query,
        status: "LOST"
      }),

      Lead.countDocuments(query),

      Task.countDocuments({
        ...query,
        dueDate: { $lt: new Date() },
        completed: false
      }),

      Document.countDocuments(query),

      Document.countDocuments({
        ...query,
        status: "PROCESSING"
      }),

      Document.countDocuments({
        ...query,
        status: "APPROVED"
      }),

      Document.countDocuments({
        ...query,
        status: "REJECTED"
      })
    ]);

    res.json({
      NEW: newLeads,
      CONTACTED: contactedLeads,
      QUALIFIED: qualifiedLeads,
      DOCUMENTS: documentLeads,
      WON: wonLeads,
      LOST: lostLeads,

      totalLeads,

      overdueTasks,

      documents: {
        total: totalDocuments,
        processing: processingDocuments,
        approved: approvedDocuments,
        rejected: rejectedDocuments
      }
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    res.status(500).json({
      message: "Failed to load dashboard",
      error: error.message
    });
  }
}

module.exports = {
  getDashboard
};