const mongoose = require("mongoose");

const inwardItemSchema = new mongoose.Schema({
  brand: { type: String, required: true },
  model: { type: String, required: true },
  size: { type: Number, required: true },
  receivedPieces: { type: Number, default: 0 },
  damagedPieces: { type: Number, default: 0 },
  remarks: { type: String, default: "" },
});

const inwardEntrySchema = new mongoose.Schema({
  dcNumber: {
    type: String,
    required: true,
    unique: true,
  },
  receivedDate: {
    type: Date,
    required: true,
  },
  items: [inwardItemSchema],
  totals: {
    received: { type: Number, default: 0 },
    damaged: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("InwardEntry", inwardEntrySchema);
