const Task = require("../models/Task");

async function createStageTask({
  brokerageId,
  leadId,
  assignedTo,
  title,
  dueDate
}) {
  return Task.create({
    brokerageId,
    leadId,
    assignedTo: assignedTo || null,
    title,
    dueDate
  });
}

module.exports = createStageTask;
