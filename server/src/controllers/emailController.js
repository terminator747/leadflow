const EmailTemplate = require("../models/EmailTemplate");

async function getTemplates(req, res) {
  try {
    const templates = await EmailTemplate.find({
      brokerageId: req.user.brokerageId
    }).sort({ createdAt: -1 });

    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function createTemplate(req, res) {
  try {
    const {
      name,
      subject,
      body,
      pipelineStage,
      enabled
    } = req.body;

    const template = await EmailTemplate.create({
      brokerageId: req.user.brokerageId,
      name,
      subject,
      body,
      pipelineStage,
      enabled: enabled !== false
    });

    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function updateTemplate(req, res) {
  try {
    const template = await EmailTemplate.findOneAndUpdate(
      {
        _id: req.params.id,
        brokerageId: req.user.brokerageId
      },
      {
        name: req.body.name,
        subject: req.body.subject,
        body: req.body.body,
        pipelineStage: req.body.pipelineStage,
        enabled: req.body.enabled
      },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({
        message: "Template not found"
      });
    }

    res.json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getTemplates,
  createTemplate,
  updateTemplate
};
