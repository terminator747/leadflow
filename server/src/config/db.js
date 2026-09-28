const dns = require("dns");
const mongoose = require("mongoose");

// Some Windows/ISP DNS resolvers refuse MongoDB Atlas SRV lookups.
// Prefer public DNS resolvers for the Atlas SRV record.
try {
  dns.setServers(["1.1.1.1", "8.8.8.8"]);
} catch (error) {
  console.warn("Could not set public DNS resolvers:", error.message);
}

async function connectDB() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing");
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000
    });

    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    console.error(
      "If the error says querySrv ECONNREFUSED, check Windows DNS/VPN/firewall and Atlas Network Access."
    );
    throw error;
  }
}

module.exports = connectDB;
