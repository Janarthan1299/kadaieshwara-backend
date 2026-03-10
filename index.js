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
app.use(cors());

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

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
