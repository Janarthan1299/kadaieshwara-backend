const express = require("express");
const router = express.Router();
const Bill = require("../models/Bill");

// Generate new invoice number
router.get("/next-invoice-no", async (req, res) => {
  try {
    const invoiceNo = await Bill.generateInvoiceNo();
    res.json({ invoiceNo });
  } catch (error) {
    res.status(500).json({ message: "Error generating invoice number", error: error.message });
  }
});

// Create a new bill
router.post("/create", async (req, res) => {
  try {
    const { items, grandTotal, totalPieces, toParty, createdBy } = req.body;

    const invoiceNo = await Bill.generateInvoiceNo();

    const bill = new Bill({
      invoiceNo,
      items,
      grandTotal,
      totalPieces,
      toParty: toParty || { name: "Ramraj Cotton", address: "" },
      createdBy: createdBy || "Admin",
    });

    await bill.save();

    res.status(201).json({
      message: "Bill generated successfully",
      bill,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating bill", error: error.message });
  }
});

// Get all bills
router.get("/", async (req, res) => {
  try {
    const bills = await Bill.find().sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bills", error: error.message });
  }
});

// Get bill by ID
router.get("/:id", async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }
    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bill", error: error.message });
  }
});

// Get bill by invoice number
router.get("/invoice/:invoiceNo", async (req, res) => {
  try {
    const bill = await Bill.findOne({ invoiceNo: req.params.invoiceNo });
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }
    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bill", error: error.message });
  }
});

// Update bill status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const bill = await Bill.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }
    res.json({ message: "Bill status updated", bill });
  } catch (error) {
    res.status(500).json({ message: "Error updating bill", error: error.message });
  }
});

// Delete bill
router.delete("/:id", async (req, res) => {
  try {
    const bill = await Bill.findByIdAndDelete(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }
    res.json({ message: "Bill deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting bill", error: error.message });
  }
});

module.exports = router;
