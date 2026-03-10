const express = require("express");
const router = express.Router();
const InwardEntry = require("../models/InwardEntry");
const Counter = require("../models/Counter");

// Get next DC number
router.get("/next-dc", async (req, res) => {
  try {
    let counter = await Counter.findOne({ name: "inwardDcNumber" });
    if (!counter) {
      counter = new Counter({ name: "inwardDcNumber", value: 0 });
      await counter.save();
    }
    const nextNumber = (counter.value + 1).toString().padStart(4, "0");
    res.json({ dcNumber: `INW-2026-${nextNumber}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all inward entries
router.get("/", async (req, res) => {
  try {
    const entries = await InwardEntry.find().sort({ createdAt: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent inward entries (limit 5)
router.get("/recent", async (req, res) => {
  try {
    const entries = await InwardEntry.find().sort({ createdAt: -1 }).limit(5);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get today's inward entries and totals
router.get("/today", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const entries = await InwardEntry.find({
      receivedDate: { $gte: today, $lt: tomorrow }
    }).sort({ createdAt: -1 });

    const totals = entries.reduce((acc, entry) => ({
      received: acc.received + (entry.totals?.received || 0),
      damaged: acc.damaged + (entry.totals?.damaged || 0),
    }), { received: 0, damaged: 0 });

    res.json({ entries, totals, date: today });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single inward entry
router.get("/:id", async (req, res) => {
  try {
    const entry = await InwardEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new inward entry
router.post("/", async (req, res) => {
  try {
    const { dcNumber, receivedDate, items, totals } = req.body;

    const entry = new InwardEntry({
      dcNumber,
      receivedDate,
      items,
      totals,
    });

    await entry.save();

    // Update counter
    let counter = await Counter.findOne({ name: "inwardDcNumber" });
    if (!counter) {
      counter = new Counter({ name: "inwardDcNumber", value: 0 });
    }
    counter.value += 1;
    await counter.save();

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete inward entry
router.delete("/:id", async (req, res) => {
  try {
    await InwardEntry.findByIdAndDelete(req.params.id);
    res.json({ message: "Entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset all inward entries
router.delete("/", async (req, res) => {
  try {
    await InwardEntry.deleteMany({});
    await Counter.findOneAndUpdate(
      { name: "inwardDcNumber" },
      { value: 0 },
      { upsert: true }
    );
    res.json({ message: "All inward entries reset successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
