const mongoose = require("mongoose");

const pipelineTaskRuleSchema = new mongoose.Schema(
  {
    brokerageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brokerage",
      required: true,
      index: true
    },
    pipelineStage: {
      type: String,
      enum: ["NEW", "CONTACTED", "QUALIFIED", "DOCUMENTS", "WON", "LOST"],
      required: true
    },
    title: { type: String, required: true, trim: true },
    dueInHours: { type: Number, required: true, min: 1, default: 24 },
    enabled: { type: Boolean, default: true }
  },
  { timestamps: true }
);

pipelineTaskRuleSchema.index({ brokerageId: 1, pipelineStage: 1, title: 1 }, { unique: true });

module.exports = mongoose.model("PipelineTaskRule", pipelineTaskRuleSchema);
