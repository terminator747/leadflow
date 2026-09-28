const mongoose = require("mongoose");

const emailTemplateSchema = new mongoose.Schema(
  {
    brokerageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brokerage",
      required: true,
      index: true
    },

    name: { type: String, required: true },

    subject: { type: String, required: true },

    body: { type: String, required: true },

    pipelineStage: {
      type: String,
      enum: ["NEW", "CONTACTED", "QUALIFIED", "DOCUMENTS", "WON", "LOST"],
      required: true
    },

    enabled: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmailTemplate", emailTemplateSchema);
