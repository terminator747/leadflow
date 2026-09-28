const Document = require("../models/Document");
const EmailTemplate = require("../models/EmailTemplate");
const replacePlaceholders = require("../utils/placeholders");
const sendEmail = require("../services/emailService");
const { getRedisConnection } = require("../config/redis");


/*
|--------------------------------------------------------------------------
| Local Document Check
|--------------------------------------------------------------------------
|
| Used when REDIS_URL is not configured.
| The document is only changed if it is still PROCESSING.
| This prevents the automatic checker from overwriting an
| advisor's manual APPROVED / REJECTED decision.
|
*/

function simulateDocumentCheck(documentId, io) {
  setTimeout(async () => {
    try {
      const approved = Math.random() > 0.2;

      const document = await Document.findOneAndUpdate(
        {
          _id: documentId,
          status: "PROCESSING"
        },
        {
          status: approved
            ? "APPROVED"
            : "REJECTED"
        },
        {
          new: true
        }
      );

      /*
       * If document is null, it means it was probably
       * manually reviewed before the automatic check finished.
       */
      if (!document) {
        console.log(
          `Local document check skipped: ${documentId} was already reviewed.`
        );

        return;
      }

      if (io) {
        io.to(
          `brokerage:${document.brokerageId}`
        ).emit(
          "documentUpdated",
          document
        );
      }

      console.log(
        `Local document check finished: ${documentId} -> ${
          approved
            ? "APPROVED"
            : "REJECTED"
        }`
      );
    } catch (error) {
      console.error(
        "Local document worker error:",
        error.message
      );
    }
  }, 10000);
}


/*
|--------------------------------------------------------------------------
| Start Workers
|--------------------------------------------------------------------------
*/

function startWorkers(io) {
  const connection = getRedisConnection();


  /*
   * No Redis
   * --------------------------------------------
   * Use a simple local background worker.
   */

  if (!connection) {
    console.log(
      "REDIS_URL not configured. Using local development background workers."
    );

    return {
      mode: "local"
    };
  }


  /*
   * Redis / BullMQ
   */

  const { Worker } = require("bullmq");


  /*
  |--------------------------------------------------------------------------
  | Document Worker
  |--------------------------------------------------------------------------
  */

  const documentWorker = new Worker(
    "document-checks",

    async (job) => {
      const document = await Document.findById(
        job.data.documentId
      );

      if (!document) {
        throw new Error(
          "Document not found"
        );
      }

      /*
       * Simulate document checking time.
       */

      await new Promise(
        (resolve) =>
          setTimeout(resolve, 10000)
      );


      /*
       * Randomly approve/reject the document.
       */

      const approved =
        Math.random() > 0.2;


      /*
       * IMPORTANT:
       *
       * Only update the document if it is
       * STILL in PROCESSING state.
       *
       * If an advisor already approved/rejected it,
       * this query returns null and their decision
       * remains unchanged.
       */

      const updated =
        await Document.findOneAndUpdate(
          {
            _id: document._id,
            status: "PROCESSING"
          },
          {
            status: approved
              ? "APPROVED"
              : "REJECTED"
          },
          {
            new: true
          }
        );


      /*
       * The document was already manually reviewed.
       */

      if (!updated) {
        console.log(
          `Document worker skipped: ${document._id} was already reviewed.`
        );

        return null;
      }


      /*
       * Notify all connected users in the brokerage.
       */

      if (io) {
        io.to(
          `brokerage:${updated.brokerageId}`
        ).emit(
          "documentUpdated",
          updated
        );
      }


      console.log(
        `Document worker finished: ${updated._id} -> ${
          approved
            ? "APPROVED"
            : "REJECTED"
        }`
      );

      return updated;
    },

    {
      connection
    }
  );


  /*
  |--------------------------------------------------------------------------
  | Document Worker Events
  |--------------------------------------------------------------------------
  */

  documentWorker.on(
    "completed",
    (job) => {
      console.log(
        `Document job completed: ${job.id}`
      );
    }
  );

  documentWorker.on(
    "failed",
    (job, error) => {
      console.error(
        `Document job failed: ${job?.id}`,
        error.message
      );
    }
  );


  /*
  |--------------------------------------------------------------------------
  | Email Worker
  |--------------------------------------------------------------------------
  */

  const emailWorker = new Worker(
    "emails",

    async (job) => {
      const {
        templateId,
        recipient,
        data
      } = job.data;

      const template =
        await EmailTemplate.findById(
          templateId
        );

      if (!template) {
        throw new Error(
          "Email template not found"
        );
      }

      const subject =
        replacePlaceholders(
          template.subject,
          data
        );

      const html =
        replacePlaceholders(
          template.body,
          data
        );

      return sendEmail({
        to: recipient,
        subject,
        html
      });
    },

    {
      connection
    }
  );


  /*
  |--------------------------------------------------------------------------
  | Email Worker Events
  |--------------------------------------------------------------------------
  */

  emailWorker.on(
    "completed",
    (job) => {
      console.log(
        `Email job completed: ${job.id}`
      );
    }
  );

  emailWorker.on(
    "failed",
    (job, error) => {
      console.error(
        `Email job failed: ${job?.id}`,
        error.message
      );
    }
  );


  console.log(
    "BullMQ workers started."
  );


  return {
    mode: "redis",
    documentWorker,
    emailWorker
  };
}


module.exports = {
  startWorkers,
  simulateDocumentCheck
};