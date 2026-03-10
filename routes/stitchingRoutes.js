const express = require("express");
const router = express.Router();
const StitchingWork = require("../models/StitchingWork");
const Counter = require("../models/Counter");

// Get next work number
router.get("/next-work", async (req, res) => {
  try {
    let counter = await Counter.findOne({ name: "stitchingWorkNumber" });
    if (!counter) {
      counter = new Counter({ name: "stitchingWorkNumber", value: 0 });
      await counter.save();
    }
    const nextNumber = (counter.value + 1).toString().padStart(4, "0");
    res.json({ workNumber: `STW-2026-${nextNumber}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get damaged pieces report
router.get("/damaged-pieces", async (req, res) => {
  try {
    const InwardEntry = require("../models/InwardEntry");
    
    // Get all stitching entries with damaged pieces
    const stitchingEntries = await StitchingWork.find().sort({ workDate: -1 });
    
    // Get all inward entries with damaged pieces  
    const inwardEntries = await InwardEntry.find().sort({ receivedDate: -1 });
    
    // Collect all damaged records
    const damagedRecords = [];
    let totalDamaged = 0;
    let totalDeduction = 0;
    const deductionRate = 15; // ₹15 per piece
    
    // Process stitching damages
    stitchingEntries.forEach(entry => {
      entry.items.forEach(item => {
        if (item.damagedPieces > 0) {
          const deduction = item.damagedPieces * deductionRate;
          totalDamaged += item.damagedPieces;
          totalDeduction += deduction;
          damagedRecords.push({
            id: entry.workNumber,
            date: entry.workDate,
            source: 'Stitching',
            itemType: `${item.brand} - ${item.model} - Size ${item.size}`,
            quantity: item.damagedPieces,
            reason: item.remarks || 'Stitching damage',
            deduction: deduction,
          });
        }
      });
    });
    
    // Process inward damages
    inwardEntries.forEach(entry => {
      entry.items.forEach(item => {
        if (item.damagedPieces > 0) {
          const deduction = item.damagedPieces * deductionRate;
          totalDamaged += item.damagedPieces;
          totalDeduction += deduction;
          damagedRecords.push({
            id: entry.dcNumber,
            date: entry.receivedDate,
            source: 'Inward',
            itemType: `${item.brand} - ${item.model} - Size ${item.size}`,
            quantity: item.damagedPieces,
            reason: item.remarks || 'Received damaged',
            deduction: deduction,
          });
        }
      });
    });
    
    // Sort by date descending
    damagedRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Calculate this month's damages
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthRecords = damagedRecords.filter(r => new Date(r.date) >= startOfMonth);
    const thisMonthDamaged = thisMonthRecords.reduce((sum, r) => sum + r.quantity, 0);
    const thisMonthDeduction = thisMonthRecords.reduce((sum, r) => sum + r.deduction, 0);
    
    // Calculate damage rate (damaged / total received) - get total received from inward
    const totalReceivedPieces = inwardEntries.reduce((sum, entry) => 
      sum + entry.items.reduce((s, item) => s + (item.receivedPieces || 0), 0), 0);
    const damageRate = totalReceivedPieces > 0 ? ((totalDamaged / totalReceivedPieces) * 100).toFixed(2) : '0.00';
    
    res.json({
      records: damagedRecords,
      totals: {
        totalDamaged,
        totalDeduction,
        thisMonthDamaged,
        thisMonthDeduction,
        damageRate,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending stitching work (brand-wise, size-wise) - shows ALL brands and sizes
router.get("/pending-work", async (req, res) => {
  try {
    const InwardEntry = require("../models/InwardEntry");
    
    // Get all inward entries
    const inwardEntries = await InwardEntry.find();
    
    // Get all stitching work entries
    const stitchingEntries = await StitchingWork.find();
    
    // Aggregate inward items by brand, model, size
    const inwardAggregated = {};
    inwardEntries.forEach(entry => {
      entry.items.forEach(item => {
        const key = `${item.brand}-${item.model}-${item.size}`;
        if (!inwardAggregated[key]) {
          inwardAggregated[key] = {
            brand: item.brand,
            model: item.model,
            size: item.size,
            receivedPieces: 0,
            damagedPieces: 0,
          };
        }
        inwardAggregated[key].receivedPieces += item.receivedPieces || 0;
        inwardAggregated[key].damagedPieces += item.damagedPieces || 0;
      });
    });
    
    // Aggregate stitching items by brand, model, size
    const stitchingAggregated = {};
    stitchingEntries.forEach(entry => {
      entry.items.forEach(item => {
        const key = `${item.brand}-${item.model}-${item.size}`;
        if (!stitchingAggregated[key]) {
          stitchingAggregated[key] = {
            brand: item.brand,
            model: item.model,
            size: item.size,
            stitchedPieces: 0,
            damagedPieces: 0,
          };
        }
        stitchingAggregated[key].stitchedPieces += item.stitchedPieces || 0;
        stitchingAggregated[key].damagedPieces += item.damagedPieces || 0;
      });
    });
    
    // Build brand summary - show ALL brands/sizes regardless of pending status
    const brandSummary = {};
    let totalReceived = 0;
    let totalStitched = 0;
    let totalPending = 0;
    
    // Process all inward items
    Object.keys(inwardAggregated).forEach(key => {
      const inward = inwardAggregated[key];
      const stitching = stitchingAggregated[key] || { stitchedPieces: 0, damagedPieces: 0 };
      
      const goodReceived = inward.receivedPieces - inward.damagedPieces;
      const pendingPieces = Math.max(0, goodReceived - stitching.stitchedPieces);
      
      // Build brand summary for ALL items
      if (!brandSummary[inward.brand]) {
        brandSummary[inward.brand] = {
          brand: inward.brand,
          totalReceived: 0,
          totalStitched: 0,
          totalPending: 0,
          sizes: {},
        };
      }
      brandSummary[inward.brand].totalReceived += goodReceived;
      brandSummary[inward.brand].totalStitched += stitching.stitchedPieces;
      brandSummary[inward.brand].totalPending += pendingPieces;
      
      totalReceived += goodReceived;
      totalStitched += stitching.stitchedPieces;
      totalPending += pendingPieces;
      
      // Size breakdown within brand
      if (!brandSummary[inward.brand].sizes[inward.size]) {
        brandSummary[inward.brand].sizes[inward.size] = {
          size: inward.size,
          model: inward.model,
          received: 0,
          stitched: 0,
          pending: 0,
        };
      }
      brandSummary[inward.brand].sizes[inward.size].received += goodReceived;
      brandSummary[inward.brand].sizes[inward.size].stitched += stitching.stitchedPieces;
      brandSummary[inward.brand].sizes[inward.size].pending += pendingPieces;
    });
    
    // Convert brand summary to array with sizes as array
    const brandSummaryArray = Object.values(brandSummary).map(brand => ({
      ...brand,
      sizes: Object.values(brand.sizes).sort((a, b) => a.size - b.size),
    }));
    
    // Calculate totals
    const totals = {
      totalReceived,
      totalStitched,
      totalPending,
      totalBrands: brandSummaryArray.length,
    };
    
    res.json({
      brandSummary: brandSummaryArray.sort((a, b) => a.brand.localeCompare(b.brand)),
      totals,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all stitching work entries
router.get("/", async (req, res) => {
  try {
    const entries = await StitchingWork.find().sort({ createdAt: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent stitching work (limit 5)
router.get("/recent", async (req, res) => {
  try {
    const entries = await StitchingWork.find().sort({ createdAt: -1 }).limit(5);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get today's stitching work and totals
router.get("/today", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const entries = await StitchingWork.find({
      workDate: { $gte: today, $lt: tomorrow }
    }).sort({ createdAt: -1 });

    const totals = entries.reduce((acc, entry) => ({
      stitched: acc.stitched + (entry.totals?.stitched || 0),
      damaged: acc.damaged + (entry.totals?.damaged || 0),
    }), { stitched: 0, damaged: 0 });

    res.json({ entries, totals, date: today });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get this week's stitching work (for bill generation)
router.get("/this-week", async (req, res) => {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // Calculate start of week (Sunday) in UTC
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setUTCHours(0, 0, 0, 0);
    
    // Calculate end of week (next Sunday) in UTC
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    endOfWeek.setUTCHours(23, 59, 59, 999);

    // Get all entries first, then filter by date range
    const allEntries = await StitchingWork.find({}).sort({ createdAt: -1 });
    
    // Filter entries within this week
    const entries = allEntries.filter(entry => {
      const entryDate = new Date(entry.workDate);
      return entryDate >= startOfWeek && entryDate <= endOfWeek;
    });

    // Aggregate items by brand, model, and size
    const aggregatedItems = {};
    entries.forEach(entry => {
      entry.items.forEach(item => {
        const key = `${item.brand}-${item.model}-${item.size}`;
        if (!aggregatedItems[key]) {
          aggregatedItems[key] = {
            brand: item.brand,
            model: item.model,
            size: item.size,
            stitchedPieces: 0,
            damagedPieces: 0,
          };
        }
        aggregatedItems[key].stitchedPieces += item.stitchedPieces || 0;
        aggregatedItems[key].damagedPieces += item.damagedPieces || 0;
      });
    });

    const items = Object.values(aggregatedItems);
    const totals = items.reduce((acc, item) => ({
      stitched: acc.stitched + item.stitchedPieces,
      damaged: acc.damaged + item.damagedPieces,
    }), { stitched: 0, damaged: 0 });

    res.json({ 
      entries, 
      items, 
      totals, 
      weekStart: startOfWeek, 
      weekEnd: endOfWeek,
      totalEntriesInDB: allEntries.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single stitching work entry
router.get("/:id", async (req, res) => {
  try {
    const entry = await StitchingWork.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new stitching work entry
router.post("/", async (req, res) => {
  try {
    const { workNumber, workDate, tailorName, items, totals } = req.body;

    const entry = new StitchingWork({
      workNumber,
      workDate,
      tailorName,
      items,
      totals,
    });

    await entry.save();

    // Update counter
    let counter = await Counter.findOne({ name: "stitchingWorkNumber" });
    if (!counter) {
      counter = new Counter({ name: "stitchingWorkNumber", value: 0 });
    }
    counter.value += 1;
    await counter.save();

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete stitching work entry
router.delete("/:id", async (req, res) => {
  try {
    await StitchingWork.findByIdAndDelete(req.params.id);
    res.json({ message: "Entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset all stitching work entries
router.delete("/", async (req, res) => {
  try {
    await StitchingWork.deleteMany({});
    await Counter.findOneAndUpdate(
      { name: "stitchingWorkNumber" },
      { value: 0 },
      { upsert: true }
    );
    res.json({ message: "All stitching work entries reset successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
