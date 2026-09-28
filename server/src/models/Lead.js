const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    brokerageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brokerage",
      required: true,
      index: true
    },

    externalLeadId: {
      type: String,
      default: null
    },

    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true, default: "" },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    phone: { type: String, default: "" },

    source: {
      type: String,
      default: "website"
    },

    status: {
      type: String,
      enum: ["NEW", "CONTACTED", "QUALIFIED", "DOCUMENTS", "WON", "LOST"],
      default: "NEW",
      index: true
    },

    assignedAdvisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    isDuplicate: {
      type: Boolean,
      default: false
    },

    version: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

leadSchema.index(
  { brokerageId: 1, externalLeadId: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model("Lead", leadSchema);
