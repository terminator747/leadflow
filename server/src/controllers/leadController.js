const Lead = require("../models/Lead");
const Client = require("../models/Client");
const User = require("../models/User");
const Brokerage = require("../models/Brokerage");
const Task = require("../models/Task");
const bcrypt = require("bcryptjs");

const sendEmail = require("../services/emailService");

const runPipelineAutomations =
  require("../services/pipelineAutomation");

function generateTemporaryPassword() {
  const randomPart = Math.floor(1000 + Math.random() * 9000);

  const randomLetters = Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase();

  return `LF-${randomLetters}-${randomPart}!`;
}

async function getLeads(req, res) {
  try {
    const query = {};

    if (req.user.role !== "platform_admin") {
      query.brokerageId = req.user.brokerageId;
    }

    const leads = await Lead.find(query)
      .populate("assignedAdvisor", "name email")
      .sort({ createdAt: -1 });

    res.json(leads);
  } catch (error) {
    console.error("getLeads error:", error);

    res.status(500).json({
      message: error.message
    });
  }
}

async function createLeadForBrokerage({
  brokerageId,
  externalLeadId,
  firstName,
  lastName,
  email,
  phone,
  source,
  assignedAdvisor
}) {
  const normalizedEmail = String(email).toLowerCase().trim();

  /*
   * Only check externalLeadId when one actually exists.
   * This prevents manual leads with null externalLeadId
   * from being treated as duplicates.
   */
  if (externalLeadId) {
    const existingExternal = await Lead.findOne({
      brokerageId,
      externalLeadId
    });

    if (existingExternal) {
      return {
        lead: existingExternal,
        duplicate: true,
        reason: "externalLeadId"
      };
    }
  }

  /*
   * Check whether this brokerage already knows
   * this person by email.
   */
  const knownPerson = await Lead.findOne({
    brokerageId,
    email: normalizedEmail
  });

  const leadData = {
    brokerageId,
    firstName,
    lastName: lastName || "",
    email: normalizedEmail,
    phone: phone || "",
    source: source || "website",
    assignedAdvisor: assignedAdvisor || null,
    isDuplicate: Boolean(knownPerson)
  };

  /*
   * Only add externalLeadId when it exists.
   * This works with the partial unique index we fixed earlier.
   */
  if (externalLeadId) {
    leadData.externalLeadId = externalLeadId;
  }

  const lead = await Lead.create(leadData);

  return {
    lead,
    duplicate: Boolean(knownPerson),
    reason: knownPerson ? "email" : null
  };
}

async function createLead(req, res) {
  try {
    let assignedAdvisor = req.body.assignedAdvisor || null;

    /*
     * If an advisor creates the lead, automatically
     * assign the lead to that advisor.
     */
    if (req.user.role === "advisor") {
      assignedAdvisor = req.user._id;
    }

    /*
     * If admin creates the lead without selecting
     * an advisor, assign the oldest advisor.
     */
    else if (!assignedAdvisor) {
      const firstAdvisor = await User.findOne({
        brokerageId: req.user.brokerageId,
        role: "advisor"
      }).sort({ createdAt: 1 });

      assignedAdvisor = firstAdvisor?._id || null;
    }

    const result = await createLeadForBrokerage({
      brokerageId: req.user.brokerageId,
      ...req.body,
      assignedAdvisor
    });

    const io = req.app.get("io");

    if (io && result.lead) {
      io.to(`brokerage:${req.user.brokerageId}`).emit(
        result.duplicate ? "leadDuplicate" : "leadCreated",
        result.lead
      );
    }

    /*
     * Only run the NEW-stage automation for genuinely
     * new leads.
     */
    if (!result.duplicate && result.lead) {
      await runPipelineAutomations({
        lead: result.lead,
        status: "NEW",
        io
      });
    }

    res
      .status(result.duplicate ? 200 : 201)
      .json(result);
  } catch (error) {
    console.error("createLead error:", error);

    res.status(500).json({
      message: error.message
    });
  }
}

async function updateStatus(req, res) {
  try {
    const { status, version } = req.body;

    const allowed = [
      "NEW",
      "CONTACTED",
      "QUALIFIED",
      "DOCUMENTS",
      "WON",
      "LOST"
    ];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: "Invalid pipeline stage"
      });
    }

    const filter = {
      _id: req.params.id,
      version: Number(version)
    };

    if (req.user.role !== "platform_admin") {
      filter.brokerageId = req.user.brokerageId;
    }

    const lead = await Lead.findOneAndUpdate(
      filter,
      {
        $set: {
          status
        },
        $inc: {
          version: 1
        }
      },
      {
        new: true
      }
    );

    if (!lead) {
      return res.status(409).json({
        message:
          "Lead was changed by another user. Refresh the pipeline and try again."
      });
    }

    const io = req.app.get("io");

    await runPipelineAutomations({
      lead,
      status,
      io
    });

    if (io) {
      io.to(`brokerage:${lead.brokerageId}`).emit(
        "leadUpdated",
        lead
      );
    }

    res.json(lead);
  } catch (error) {
    console.error("updateStatus error:", error);

    res.status(500).json({
      message: error.message
    });
  }
}

/*
 * Convert a lead into a client.
 *
 * Flow:
 *
 * Lead
 *   ↓
 * User with role=client
 *   ↓
 * Client record
 *   ↓
 * Lead status=WON
 *   ↓
 * Activation email
 */
async function convertToClient(req, res) {
  try {
    const filter = {
      _id: req.params.id
    };

    /*
     * Non-platform users can only convert leads
     * belonging to their own brokerage.
     */
    if (req.user.role !== "platform_admin") {
      filter.brokerageId = req.user.brokerageId;
    }

    const lead = await Lead.findOne(filter);

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found"
      });
    }

    /*
     * Prevent converting the same lead twice.
     */
    const existingClient = await Client.findOne({
      leadId: lead._id
    });

    if (existingClient) {
      const existingClientUser = await User.findById(
        existingClient.userId
      ).select("name email role");

      return res.json({
        client: existingClient,
        user: existingClientUser,
        temporaryPassword: null,
        alreadyConverted: true,
        message: "This lead is already a client."
      });
    }

    /*
     * Check whether a user with this email already exists.
     */
    let user = await User.findOne({
      email: lead.email
    });

    let temporaryPassword = null;
    let newlyCreatedUser = false;

    /*
     * If no user exists, create the client account.
     */
    if (!user) {
      temporaryPassword = generateTemporaryPassword();

      const hashedPassword = await bcrypt.hash(
        temporaryPassword,
        10
      );

      user = await User.create({
        name: `${lead.firstName} ${lead.lastName}`.trim(),
        email: lead.email,
        password: hashedPassword,
        role: "client",
        brokerageId: lead.brokerageId
      });

      newlyCreatedUser = true;
    } else {
      /*
       * If the email already belongs to another account,
       * don't silently change that account's role.
       */
      if (user.role !== "client") {
        return res.status(409).json({
          message:
            `A user with ${lead.email} already exists with role "${user.role}". ` +
            "Use a different email for the client account."
        });
      }

      /*
       * Existing client user.
       * Make sure the account belongs to the same brokerage.
       */
      if (
        String(user.brokerageId) !==
        String(lead.brokerageId)
      ) {
        return res.status(409).json({
          message:
            "This client account belongs to a different brokerage."
        });
      }
    }

    /*
     * Create the Client record.
     */
    const client = await Client.create({
      brokerageId: lead.brokerageId,
      userId: user._id,
      leadId: lead._id,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      advisorId: lead.assignedAdvisor || null
    });

    /*
     * Move the lead to WON.
     */
    lead.status = "WON";
    lead.version += 1;

    await lead.save();

    /*
     * ----------------------------------------------------
     * SEND CLIENT LOGIN CREDENTIALS
     * ----------------------------------------------------
     *
     * Only send credentials when a brand-new client
     * account was created.
     *
     * If the client already had an account, we do not
     * generate or send a new password.
     */
    if (newlyCreatedUser && temporaryPassword) {
      try {
        const brokerage = await Brokerage.findById(
          lead.brokerageId
        );

        const loginUrl =
          process.env.CLIENT_URL ||
          "http://localhost:5173";

        await sendEmail({
          to: lead.email,

          subject: "Your LeadFlow client account",

          html: `
            <div style="
              font-family: Arial, sans-serif;
              max-width: 600px;
              margin: 0 auto;
              color: #1b281f;
            ">

              <h2>
                Your LeadFlow client account is ready
              </h2>

              <p>
                Hello ${lead.firstName},
              </p>

              <p>
                Your mortgage case has been created with
                ${brokerage?.name || "your brokerage"}.
              </p>

              <p>
                You can now log in to the LeadFlow client
                portal and upload your case documents.
              </p>

              <div style="
                background:#f3f7f4;
                padding:20px;
                border-radius:10px;
                margin:20px 0;
                border:1px solid #dce9df;
              ">

                <p>
                  <strong>Login:</strong>
                  ${lead.email}
                </p>

                <p>
                  <strong>Temporary password:</strong>
                  ${temporaryPassword}
                </p>

              </div>

              <p>
                <a
                  href="${loginUrl}/login"
                  style="
                    display:inline-block;
                    padding:12px 18px;
                    background:#315f3c;
                    color:#ffffff;
                    text-decoration:none;
                    border-radius:8px;
                  "
                >
                  Open LeadFlow
                </a>
              </p>

              <p>
                Please keep your login credentials private.
              </p>

              <p>
                Regards,<br/>
                ${brokerage?.name || "LeadFlow"}
              </p>

            </div>
          `
        });

        console.log(
          `Client activation email processed for ${lead.email}`
        );
      } catch (emailError) {
        /*
         * Don't fail client creation simply because
         * the email provider failed.
         */
        console.error(
          "Client activation email failed:",
          emailError.message
        );
      }
    }

    /*
     * Notify connected brokerage users.
     */
    const io = req.app.get("io");

    if (io) {
      io.to(`brokerage:${lead.brokerageId}`).emit(
        "leadUpdated",
        lead
      );

      io.to(`brokerage:${lead.brokerageId}`).emit(
        "clientCreated",
        client
      );
    }

    /*
     * Return temporary credentials ONLY when
     * a brand-new client account was created.
     */
    res.status(201).json({
      client,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        brokerageId: user.brokerageId
      },

      temporaryPassword,

      newlyCreatedUser,

      alreadyConverted: false,

      message: newlyCreatedUser
        ? "Client created successfully. Save the temporary password and give it to the client securely."
        : "Client created and linked to the existing client account."
    });
  } catch (error) {
    console.error(
      "convertToClient error:",
      error
    );

    /*
     * Handle duplicate database records cleanly.
     */
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "This client account already exists. Refresh the page and try again."
      });
    }

    res.status(500).json({
      message: error.message
    });
  }
}

module.exports = {
  getLeads,
  createLead,
  createLeadForBrokerage,
  updateStatus,
  convertToClient
};