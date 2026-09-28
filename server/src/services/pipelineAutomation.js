const Brokerage = require("../models/Brokerage");
const User = require("../models/User");
const Task = require("../models/Task");
const EmailTemplate = require("../models/EmailTemplate");
const PipelineTaskRule = require("../models/PipelineTaskRule");
const createStageTask = require("./taskService");
const replacePlaceholders = require("../utils/placeholders");
const sendEmail = require("./emailService");
const { getQueues } = require("../queues/queues");

async function runPipelineAutomations({ lead, status, io }) {
  const brokerage = await Brokerage.findById(lead.brokerageId);
  const advisor = lead.assignedAdvisor
    ? await User.findById(lead.assignedAdvisor).select("name email")
    : null;

  const rules = await PipelineTaskRule.find({
    brokerageId: lead.brokerageId,
    pipelineStage: status,
    enabled: true
  });

  for (const rule of rules) {
    const existingTask = await Task.findOne({
      brokerageId: lead.brokerageId,
      leadId: lead._id,
      title: rule.title,
      status: "PENDING"
    });

    if (!existingTask) {
      await createStageTask({
        brokerageId: lead.brokerageId,
        leadId: lead._id,
        assignedTo: lead.assignedAdvisor,
        title: rule.title,
        dueDate: new Date(Date.now() + rule.dueInHours * 60 * 60 * 1000)
      });
    }
  }

  const template = await EmailTemplate.findOne({
    brokerageId: lead.brokerageId,
    pipelineStage: status,
    enabled: true
  });

  if (template) {
    const variables = {
      clientName: `${lead.firstName} ${lead.lastName}`.trim(),
      leadName: `${lead.firstName} ${lead.lastName}`.trim(),
      advisorName: advisor?.name || "Your advisor",
      brokerageName: brokerage?.name || "LeadFlow"
    };

    const emailPayload = {
      to: lead.email,
      subject: replacePlaceholders(template.subject, variables),
      html: replacePlaceholders(template.body, variables)
    };

    const { emailQueue } = getQueues();

    if (emailQueue) {
      await emailQueue.add(
        "pipeline-email",
        {
          templateId: template._id.toString(),
          recipient: lead.email,
          variables
        },
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 100
        }
      );
    } else {
      // Local/demo mode: send directly when an email provider is configured;
      // otherwise emailService prints a safe simulation to the server console.
      try {
        await sendEmail(emailPayload);
      } catch (error) {
        console.error("Pipeline email could not be sent:", error.message);
      }
    }
  }

  if (io) {
    io.to(`brokerage:${lead.brokerageId}`).emit("leadAutomationTriggered", {
      leadId: lead._id,
      status
    });
  }
}

module.exports = runPipelineAutomations;
