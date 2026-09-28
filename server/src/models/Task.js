const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    brokerageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brokerage",
      required: true,
      index: true
    },

    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null
    },

    title: { type: String, required: true },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    dueDate: { type: Date, required: true },

    status: {
      type: String,
      enum: ["PENDING", "COMPLETED"],
      default: "PENDING"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
