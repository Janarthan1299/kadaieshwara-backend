const mongoose = require("mongoose");

const stitchingItemSchema = new mongoose.Schema({
  brand: { type: String, required: true },
  model: { type: String, required: true },
  size: { type: Number, required: true },
  stitchedPieces: { type: Number, default: 0 },
  damagedPieces: { type: Number, default: 0 },
  remarks: { type: String, default: "" },
});

const stitchingWorkSchema = new mongoose.Schema({
  workNumber: {
    type: String,
    required: true,
    unique: true,
  },
  workDate: {
    type: Date,
    required: true,
  },
  tailorName: {
    type: String,
    default: "",
  },
  items: [stitchingItemSchema],
  totals: {
    stitched: { type: Number, default: 0 },
    damaged: { type: Number, default: 0 },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("StitchingWork", stitchingWorkSchema);
