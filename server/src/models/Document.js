const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    brokerageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brokerage",
      required: true,
      index: true
    },

    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true
    },

    name: { type: String, required: true },
    fileUrl: { type: String, required: true },
    publicId: { type: String, default: null },

    status: {
      type: String,
      enum: ["UPLOADED", "PROCESSING", "APPROVED", "REJECTED"],
      default: "UPLOADED",
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
