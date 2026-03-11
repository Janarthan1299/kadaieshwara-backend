const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://kadaieshwara-frontend-mbjx.vercel.app',
    'https://kadaieshwara.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://admin:admin123@cluster0.tujvwxu.mongodb.net/?appName=Cluster0";

mongoose.connect(MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Error:", err));

// Load routes
const adminRoutes = require("./routes/adminRoutes");
const billRoutes = require("./routes/billRoutes");
const stockRoutes = require("./routes/stockRoutes");
const inwardRoutes = require("./routes/inwardRoutes");
const stitchingRoutes = require("./routes/stitchingRoutes");
const employeeRoutes = require("./routes/employeeRoutes");

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/inward", inwardRoutes);
app.use("/api/stitching", stitchingRoutes);
app.use("/api/employees", employeeRoutes);

// Also mount routes without /api prefix
app.use("/admin", adminRoutes);
app.use("/bills", billRoutes);
app.use("/stock", stockRoutes);
app.use("/inward", inwardRoutes);
app.use("/stitching", stitchingRoutes);
app.use("/employees", employeeRoutes);

app.get("/", (req, res) => {
  res.send("Backend Running Successfully");
});

// Error handling
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

// Export for Vercel
module.exports = app;

// Local development only - don't listen on Vercel
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
}
