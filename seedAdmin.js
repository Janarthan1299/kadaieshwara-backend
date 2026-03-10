const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");

const MONGODB_URI =
  "mongodb+srv://admin:admin123@cluster0.tujvwxu.mongodb.net/?appName=Cluster0";

const admins = [
  { username: "Govind", email: "govind@gmail.com", password: "govind@1115" },
  { username: "Anbu", email: "anbu@gmail.com", password: "anbu@1261" },
  { username: "Prabhu", email: "prabhu@gmail.com", password: "prabhu@8666" },
];

const seedAdmins = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB Connected");

    // Clear existing admins
    await Admin.deleteMany({});
    console.log("Cleared existing admins");

    // Hash passwords and create admins
    for (const admin of admins) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(admin.password, salt);

      await Admin.create({
        username: admin.username,
        email: admin.email,
        password: hashedPassword,
      });
      console.log(`Created admin: ${admin.email}`);
    }

    console.log("All admins seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding admins:", error);
    process.exit(1);
  }
};

seedAdmins();
