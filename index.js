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

// MongoDB connection with caching for serverless
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://admin:admin123@cluster0.tujvwxu.mongodb.net/?appName=Cluster0";

let cachedDb = null;

const connectToDatabase = async () => {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }
  
  try {
    const db = await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
    cachedDb = db;
    console.log("MongoDB Connected");
    return db;
  } catch (err) {
    console.log("MongoDB Error:", err);
    throw err;
  }
};

// Middleware to ensure DB connection before handling requests
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    res.status(500).json({ error: "Database connection failed" });
  }
});

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({ error: err.message || "Internal Server Error" });
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
