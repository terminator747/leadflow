const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Brokerage = require("../models/Brokerage");
const generateToken = require("../utils/jwt");

function publicUser(user, brokerage) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    brokerageId: user.brokerageId,
    brokerageName: brokerage?.name || null,
    brokerageCode: brokerage?.inviteCode || null
  };
}

async function register(req, res) {
  try {
    const {
      name,
      email,
      password,
      accountType = "brokerage_admin",
      brokerageName,
      brokerageCode
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters"
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      return res.status(409).json({
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (accountType === "advisor") {
      if (!brokerageCode) {
        return res.status(400).json({
          message: "Brokerage invite code is required for advisor registration"
        });
      }

      const brokerage = await Brokerage.findOne({
        inviteCode: String(brokerageCode).trim().toUpperCase()
      });

      if (!brokerage) {
        return res.status(400).json({
          message: "Invalid brokerage invite code"
        });
      }

      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: "advisor",
        brokerageId: brokerage._id
      });

      return res.status(201).json({
        token: generateToken(user),
        user: publicUser(user, brokerage)
      });
    }

    if (!brokerageName) {
      return res.status(400).json({
        message: "Brokerage name is required"
      });
    }

    const brokerage = await Brokerage.create({
      name: brokerageName.trim()
    });

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "brokerage_admin",
      brokerageId: brokerage._id
    });

    res.status(201).json({
      token: generateToken(user),
      user: publicUser(user, brokerage)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: String(email || "").toLowerCase().trim()
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const valid = await bcrypt.compare(password || "", user.password);

    if (!valid) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const brokerage = user.brokerageId
      ? await Brokerage.findById(user.brokerageId)
      : null;

    res.json({
      token: generateToken(user),
      user: publicUser(user, brokerage)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = { register, login };
