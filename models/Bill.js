const mongoose = require("mongoose");

const billItemSchema = new mongoose.Schema({
  brand: { type: String, required: true },
  model: { type: String, required: true },
  size: { type: String, required: true },
  pieces: { type: Number, required: true },
  damagedPieces: { type: Number, default: 0 },
  rate: { type: Number, required: true },
  damageDeduction: { type: Number, default: 0 },
  total: { type: Number, required: true },
  inwardDcNo: { type: String, default: "" },
  outwardDcNo: { type: String, default: "" },
  sac: { type: String, default: "998819" }, // SAC code for stitching services
});

const billSchema = new mongoose.Schema({
  invoiceNo: { type: String, required: true, unique: true },
  invoiceDate: { type: Date, default: Date.now },
  toParty: {
    name: { type: String, default: "Ramraj Cotton" },
    address: { type: String, default: "" },
  },
  items: [billItemSchema],
  grandTotal: { type: Number, required: true },
  totalPieces: { type: Number, required: true },
  status: { type: String, enum: ["Generated", "Paid", "Pending"], default: "Generated" },
  createdBy: { type: String, default: "Admin" },
  createdAt: { type: Date, default: Date.now },
});

// Auto-generate invoice number
billSchema.statics.generateInvoiceNo = async function () {
  const currentYear = new Date().getFullYear();
  const lastBill = await this.findOne({
    invoiceNo: new RegExp(`^KT-${currentYear}-`),
  }).sort({ invoiceNo: -1 });

  if (lastBill) {
    const lastNo = parseInt(lastBill.invoiceNo.split("-")[2]);
    return `KT-${currentYear}-${String(lastNo + 1).padStart(4, "0")}`;
  }
  return `KT-${currentYear}-0001`;
};

module.exports = mongoose.model("Bill", billSchema);
