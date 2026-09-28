const express = require("express");
const Lead = require("../models/Lead");
const Brokerage = require("../models/Brokerage");
const User = require("../models/User");
const runPipelineAutomations = require("../services/pipelineAutomation");
const {
  createLeadForBrokerage
} = require("../controllers/leadController");

const router = express.Router();

router.post("/leads", async (req, res) => {
  try {
    const {
      brokerageId,
      externalLeadId,
      firstName,
      lastName,
      email,
      phone,
      source
    } = req.body;

    if (!brokerageId || !firstName || !email) {
      return res.status(400).json({
        message: "brokerageId, firstName and email are required"
      });
    }

    const brokerage = await Brokerage.findById(brokerageId);

    if (!brokerage) {
      return res.status(404).json({
        message: "Brokerage not found"
      });
    }

    const firstAdvisor = await User.findOne({
      brokerageId,
      role: "advisor"
    }).sort({ createdAt: 1 });

    const result = await createLeadForBrokerage({
      brokerageId,
      externalLeadId,
      firstName,
      lastName,
      email,
      phone,
      source: source || "external",
      assignedAdvisor: firstAdvisor?._id || null
    });

    const io = req.app.get("io");

    if (io && result.lead) {
      io.to(`brokerage:${brokerageId}`).emit(
        result.duplicate ? "leadDuplicate" : "leadCreated",
        result.lead
      );
    }

    if (!result.duplicate && result.lead) {
      await runPipelineAutomations({
        lead: result.lead,
        status: "NEW",
        io
      });
    }

    res.status(result.duplicate ? 200 : 201).json({
      message: result.duplicate
        ? `Lead already exists or is a known person (${result.reason})`
        : "Lead received",
      ...result
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({
        message: "Duplicate webhook ignored"
      });
    }

    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
