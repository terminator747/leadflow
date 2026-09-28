const { getRedisConnection } = require("../config/redis");

let documentQueue = null;
let emailQueue = null;

function getQueues() {
  const connection = getRedisConnection();

  if (!connection) {
    return {
      documentQueue: null,
      emailQueue: null,
      connection: null
    };
  }

  const { Queue } = require("bullmq");

  if (!documentQueue) {
    documentQueue = new Queue("document-checks", { connection });
  }

  if (!emailQueue) {
    emailQueue = new Queue("emails", { connection });
  }

  return { documentQueue, emailQueue, connection };
}

module.exports = { getQueues };
