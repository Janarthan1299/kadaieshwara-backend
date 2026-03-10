const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee");

// Default employees to seed
const defaultEmployees = [
  { name: "Senthil", status: "Active" },
  { name: "Siva", status: "Active" },
  { name: "Raja", status: "Active" },
  { name: "Kumar", status: "Active" },
  { name: "Gokila", status: "Active" },
  { name: "Dhivya", status: "Active" },
  { name: "Baranika", status: "Active" },
  { name: "Aiyavu", status: "Active" },
  { name: "Kavin", status: "Active" },
  { name: "Kamachi", status: "Active" },
];

// Seed default employees if none exist
router.post("/seed", async (req, res) => {
  try {
    const count = await Employee.countDocuments();
    if (count === 0) {
      await Employee.insertMany(defaultEmployees);
      res.json({ message: "Default employees seeded successfully", count: defaultEmployees.length });
    } else {
      res.json({ message: "Employees already exist", count });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all employees
router.get("/", async (req, res) => {
  try {
    const employees = await Employee.find().sort({ name: 1 });
    
    // If no employees, seed defaults
    if (employees.length === 0) {
      await Employee.insertMany(defaultEmployees);
      const seededEmployees = await Employee.find().sort({ name: 1 });
      return res.json(seededEmployees);
    }
    
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active employees only
router.get("/active", async (req, res) => {
  try {
    const employees = await Employee.find({ status: "Active" }).sort({ name: 1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get weekly stitching stats for all employees
router.get("/weekly-stats", async (req, res) => {
  try {
    const StitchingWork = require("../models/StitchingWork");
    
    // Calculate start and end of current week (Sunday to Saturday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Get all stitching entries for this week
    const stitchingEntries = await StitchingWork.find({
      workDate: { $gte: startOfWeek, $lte: endOfWeek }
    });
    
    // Aggregate by tailor name
    const employeeStats = {};
    stitchingEntries.forEach(entry => {
      const tailorName = entry.tailorName?.trim() || "Unknown";
      if (!employeeStats[tailorName]) {
        employeeStats[tailorName] = { stitched: 0, entries: 0 };
      }
      employeeStats[tailorName].stitched += entry.totals?.stitched || 0;
      employeeStats[tailorName].entries += 1;
    });
    
    res.json({
      weekStart: startOfWeek,
      weekEnd: endOfWeek,
      stats: employeeStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single employee
router.get("/:id", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new employee
router.post("/", async (req, res) => {
  try {
    const { name, phone, address, status } = req.body;
    
    const employee = new Employee({
      name,
      phone: phone || "",
      address: address || "",
      status: status || "Active",
    });
    
    await employee.save();
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update employee
router.put("/:id", async (req, res) => {
  try {
    const { name, phone, address, status } = req.body;
    
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { name, phone, address, status },
      { new: true }
    );
    
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete employee
router.delete("/:id", async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
