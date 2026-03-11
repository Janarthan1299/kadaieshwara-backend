const express = require("express");
const mongoose = require("mongoose");
const adminRoutes = require("./routes/adminRoutes");
const billRoutes = require("./routes/billRoutes");
const stockRoutes = require("./routes/stockRoutes");
const inwardRoutes = require("./routes/inwardRoutes");
const stitchingRoutes = require("./routes/stitchingRoutes");
const employeeRoutes = require("./routes/employeeRoutes");

const app = express();

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://kadaieshwara-frontend-mbjx.vercel.app'
];

// Handle preflight requests explicitly - MUST be before other middleware
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', 'https://kadaieshwara-frontend-mbjx.vercel.app');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  return res.status(200).end();
});

// CORS middleware for all requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', 'https://kadaieshwara-frontend-mbjx.vercel.app');
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use(express.json());

mongoose
  .connect(
    "mongodb+srv://admin:admin123@cluster0.tujvwxu.mongodb.net/?appName=Cluster0"
  )
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("Mongo Error:", err));

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/inward", inwardRoutes);
app.use("/api/stitching", stitchingRoutes);
app.use("/api/employees", employeeRoutes);

// Also mount routes without /api prefix for flexibility
app.use("/admin", adminRoutes);
app.use("/bills", billRoutes);
app.use("/stock", stockRoutes);
app.use("/inward", inwardRoutes);
app.use("/stitching", stitchingRoutes);
app.use("/employees", employeeRoutes);

app.get("/", (req, res) => {
  res.send("Backend Running Successfully");
});

// Export for Vercel serverless
module.exports = app;

// Only listen when running locally (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
}
