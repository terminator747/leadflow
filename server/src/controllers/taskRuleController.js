const PipelineTaskRule = require("../models/PipelineTaskRule");

const stages = ["NEW", "CONTACTED", "QUALIFIED", "DOCUMENTS", "WON", "LOST"];

async function getRules(req, res) {
  try {
    const rules = await PipelineTaskRule.find({
      brokerageId: req.user.brokerageId
    }).sort({ pipelineStage: 1, createdAt: 1 });

    res.json(rules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function createRule(req, res) {
  try {
    const { pipelineStage, title, dueInHours, enabled = true } = req.body;

    if (!stages.includes(pipelineStage)) {
      return res.status(400).json({ message: "Invalid pipeline stage" });
    }

    const rule = await PipelineTaskRule.create({
      brokerageId: req.user.brokerageId,
      pipelineStage,
      title,
      dueInHours: Number(dueInHours),
      enabled
    });

    res.status(201).json(rule);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A task rule with this title already exists for that stage"
      });
    }

    res.status(500).json({ message: error.message });
  }
}

async function updateRule(req, res) {
  try {
    const rule = await PipelineTaskRule.findOneAndUpdate(
      {
        _id: req.params.id,
        brokerageId: req.user.brokerageId
      },
      {
        pipelineStage: req.body.pipelineStage,
        title: req.body.title,
        dueInHours: Number(req.body.dueInHours),
        enabled: req.body.enabled
      },
      { new: true, runValidators: true }
    );

    if (!rule) {
      return res.status(404).json({ message: "Task rule not found" });
    }

    res.json(rule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = { getRules, createRule, updateRule };
