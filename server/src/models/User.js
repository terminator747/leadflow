const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["platform_admin", "brokerage_admin", "advisor", "client"],
      required: true
    },

    brokerageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brokerage",
      default: null,
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
