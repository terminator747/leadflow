require("dotenv").config();

const bcrypt = require("bcryptjs");

const connectDB = require("./config/db");

const Brokerage = require("./models/Brokerage");
const User = require("./models/User");
const Lead = require("./models/Lead");
const Client = require("./models/Client");
const EmailTemplate = require("./models/EmailTemplate");
const Task = require("./models/Task");
const PipelineTaskRule = require("./models/PipelineTaskRule");

async function seed() {
  await connectDB();

  await Task.deleteMany({});
  await PipelineTaskRule.deleteMany({});
  await EmailTemplate.deleteMany({});
  await Client.deleteMany({});
  await Lead.deleteMany({});
  await User.deleteMany({});
  await Brokerage.deleteMany({});

  const brokerage = await Brokerage.create({
    name: "Demo Mortgage Brokerage",
    inviteCode: "LF-DEMO-7X42"
  });

  const password = await bcrypt.hash("Password123!", 10);

  const platformAdmin = await User.create({
    name: "Platform Admin",
    email: "platform@leadflow.test",
    password,
    role: "platform_admin"
  });

  const brokerageAdmin = await User.create({
    name: "Brokerage Admin",
    email: "admin@leadflow.test",
    password,
    role: "brokerage_admin",
    brokerageId: brokerage._id
  });

  const advisor = await User.create({
    name: "Demo Advisor",
    email: "advisor@leadflow.test",
    password,
    role: "advisor",
    brokerageId: brokerage._id
  });

  const clientUser = await User.create({
    name: "Demo Client",
    email: "client@leadflow.test",
    password,
    role: "client",
    brokerageId: brokerage._id
  });

  const leads = await Lead.insertMany([
    {
      brokerageId: brokerage._id,
      externalLeadId: "seed-001",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "+49111111111",
      source: "website",
      status: "NEW",
      assignedAdvisor: advisor._id
    },
    {
      brokerageId: brokerage._id,
      externalLeadId: "seed-002",
      firstName: "Sarah",
      lastName: "Smith",
      email: "sarah@example.com",
      phone: "+49222222222",
      source: "partner",
      status: "CONTACTED",
      assignedAdvisor: advisor._id
    },
    {
      brokerageId: brokerage._id,
      externalLeadId: "seed-003",
      firstName: "Mike",
      lastName: "Ross",
      email: "mike@example.com",
      phone: "+49333333333",
      source: "website",
      status: "QUALIFIED",
      assignedAdvisor: advisor._id
    }
  ]);

  await Client.create({
    brokerageId: brokerage._id,
    userId: clientUser._id,
    firstName: "Demo",
    lastName: "Client",
    email: "client@leadflow.test",
    phone: "+49000000000",
    advisorId: advisor._id
  });

  await EmailTemplate.create({
    brokerageId: brokerage._id,
    name: "Welcome Email",
    subject: "Welcome {{clientName}}",
    body:
      "<h2>Welcome {{clientName}}</h2><p>Your advisor is {{advisorName}}.</p><p>Welcome to {{brokerageName}}.</p>",
    pipelineStage: "NEW",
    enabled: true
  });

  await PipelineTaskRule.insertMany([
    { brokerageId: brokerage._id, pipelineStage: "NEW", title: "Call within 2 hours", dueInHours: 2, enabled: true },
    { brokerageId: brokerage._id, pipelineStage: "CONTACTED", title: "Follow up tomorrow", dueInHours: 24, enabled: true },
    { brokerageId: brokerage._id, pipelineStage: "QUALIFIED", title: "Request documents", dueInHours: 24, enabled: true },
    { brokerageId: brokerage._id, pipelineStage: "DOCUMENTS", title: "Review submitted documents", dueInHours: 12, enabled: true }
  ]);

  await Task.create({
    brokerageId: brokerage._id,
    leadId: leads[0]._id,
    title: "Call within 2 hours",
    assignedTo: advisor._id,
    dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
    status: "PENDING"
  });

  console.log("\nLeadFlow seed complete.\n");
  console.log("Brokerage ID:", brokerage._id.toString());
  console.log("Advisor Invite Code:", brokerage.inviteCode);
  console.log("Platform Admin: platform@leadflow.test / Password123!");
  console.log("Brokerage Admin: admin@leadflow.test / Password123!");
  console.log("Advisor: advisor@leadflow.test / Password123!");
  console.log("Client: client@leadflow.test / Password123!\n");

  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
