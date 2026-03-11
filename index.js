const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const adminRoutes = require("./routes/adminRoutes");
const billRoutes = require("./routes/billRoutes");
const stockRoutes = require("./routes/stockRoutes");
const inwardRoutes = require("./routes/inwardRoutes");
const stitchingRoutes = require("./routes/stitchingRoutes");
const employeeRoutes = require("./routes/employeeRoutes");

const app = express();

app.use(express.json());

// CORS configuration for Vercel deployment
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://kadaieshwara-frontend-mbjx.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

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
