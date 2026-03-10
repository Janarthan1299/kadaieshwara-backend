const express = require("express");
const router = express.Router();
const Stock = require("../models/Stock");
const InwardEntry = require("../models/InwardEntry");
const StitchingWork = require("../models/StitchingWork");

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "Stock routes working" });
});

// Get all stock
router.get("/", async (req, res) => {
  try {
    const stocks = await Stock.find().sort({ brand: 1, model: 1, size: 1 });
    
    const stockObject = {};
    stocks.forEach(stock => {
      stockObject[stock.stockKey] = {
        brand: stock.brand,
        model: stock.model,
        size: stock.size,
        received: stock.received,
        stitched: stock.stitched,
        damaged: stock.damaged,
        pending: stock.pending,
      };
    });
    
    res.json(stockObject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stock totals
router.get("/totals", async (req, res) => {
  try {
    const totals = await Stock.aggregate([
      {
        $group: {
          _id: null,
          received: { $sum: "$received" },
          stitched: { $sum: "$stitched" },
          damaged: { $sum: "$damaged" },
          pending: { $sum: "$pending" },
        },
      },
    ]);
    
    res.json(totals[0] || { received: 0, stitched: 0, damaged: 0, pending: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update stock (for inward entry)
router.post("/inward", async (req, res) => {
  try {
    const { items } = req.body;
    
    for (const item of items) {
      const stockKey = `${item.brand}-${item.model}-${item.size}`;
      
      let stock = await Stock.findOne({ stockKey });
      
      if (!stock) {
        stock = new Stock({
          stockKey,
          brand: item.brand,
          model: item.model,
          size: item.size,
          received: 0,
          stitched: 0,
          damaged: 0,
        });
      }
      
      stock.received += item.receivedPieces || 0;
      stock.damaged += item.damagedPieces || 0;
      await stock.save();
    }
    
    res.json({ message: "Stock updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update stock (for stitching work)
router.post("/stitching", async (req, res) => {
  try {
    const { items } = req.body;
    
    for (const item of items) {
      const stockKey = `${item.brand}-${item.model}-${item.size}`;
      
      let stock = await Stock.findOne({ stockKey });
      
      if (!stock) {
        stock = new Stock({
          stockKey,
          brand: item.brand,
          model: item.model,
          size: item.size,
          received: 0,
          stitched: 0,
          damaged: 0,
        });
      }
      
      stock.stitched += item.stitchedPieces || 0;
      await stock.save();
    }
    
    res.json({ message: "Stock updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync stock from all entries
router.post("/sync", async (req, res) => {
  try {
    // Clear existing stock
    await Stock.deleteMany({});
    
    const stockMap = {};
    
    // Get all inward entries
    const inwardEntries = await InwardEntry.find({});
    console.log("Inward entries found:", inwardEntries.length);
    
    // Process inward entries
    inwardEntries.forEach(entry => {
      if (entry.items && entry.items.length > 0) {
        entry.items.forEach(item => {
          const key = `${item.brand}-${item.model}-${item.size}`;
          if (!stockMap[key]) {
            stockMap[key] = {
              brand: item.brand,
              model: item.model,
              size: item.size,
              received: 0,
              stitched: 0,
              damaged: 0,
            };
          }
          stockMap[key].received += Number(item.receivedPieces) || 0;
          stockMap[key].damaged += Number(item.damagedPieces) || 0;
        });
      }
    });
    
    // Get all stitching entries
    const stitchingEntries = await StitchingWork.find({});
    console.log("Stitching entries found:", stitchingEntries.length);
    
    // Process stitching entries
    stitchingEntries.forEach(entry => {
      if (entry.items && entry.items.length > 0) {
        entry.items.forEach(item => {
          const key = `${item.brand}-${item.model}-${item.size}`;
          if (!stockMap[key]) {
            stockMap[key] = {
              brand: item.brand,
              model: item.model,
              size: item.size,
              received: 0,
              stitched: 0,
              damaged: 0,
            };
          }
          stockMap[key].stitched += Number(item.stitchedPieces) || 0;
        });
      }
    });
    
    // Save stock records
    const keys = Object.keys(stockMap);
    console.log("Stock items to save:", keys.length);
    
    for (const key of keys) {
      const item = stockMap[key];
      const stock = new Stock({
        stockKey: key,
        brand: item.brand,
        model: item.model,
        size: item.size,
        received: item.received,
        stitched: item.stitched,
        damaged: item.damaged,
      });
      await stock.save();
    }
    
    res.json({ 
      message: "Stock synced successfully",
      inwardEntries: inwardEntries.length,
      stitchingEntries: stitchingEntries.length,
      stockItems: keys.length
    });
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Reset all stock
router.delete("/reset", async (req, res) => {
  try {
    await Stock.deleteMany({});
    res.json({ message: "Stock reset successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
