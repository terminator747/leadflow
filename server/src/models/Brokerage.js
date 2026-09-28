const crypto = require("crypto");
const mongoose = require("mongoose");

function makeInviteCode() {
  return `LF-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

const brokerageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: makeInviteCode
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Brokerage", brokerageSchema);
