const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
  stockKey: {
    type: String,
    required: true,
    unique: true, // brand-model-size combination
  },
  brand: {
    type: String,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  received: {
    type: Number,
    default: 0,
  },
  stitched: {
    type: Number,
    default: 0,
  },
  damaged: {
    type: Number,
    default: 0,
  },
  pending: {
    type: Number,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save middleware to calculate pending
stockSchema.pre('save', function(next) {
  this.pending = (this.received || 0) - (this.stitched || 0) - (this.damaged || 0);
  this.updatedAt = Date.now();
  if (typeof next === 'function') {
    next();
  }
});

module.exports = mongoose.model("Stock", stockSchema);
