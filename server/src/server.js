require("dotenv").config();

const fs = require("fs");
const path = require("path");
const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const { startWorkers } = require("./jobs/workers");

const app = express();
const server = http.createServer(app);

const normalizeOrigin = (value) => {
  if (!value) return null;
  return value.trim().replace(/\/+$/, "");
};

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  normalizeOrigin(process.env.CLIENT_URL)
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow requests without an Origin header, such as health checks.
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = normalizeOrigin(origin);

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.error("CORS blocked origin:", origin);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

const io = new Server(server, {
  cors: corsOptions
});

app.set("io", io);

// CORS must run before the API routes.
app.use(cors(corsOptions));

// Explicitly respond to browser preflight requests.
app.options(/.*/, cors(corsOptions));

app.use(express.json());

const uploadsDir = path.join(process.cwd(), "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

app.get("/", (req, res) => {
  res.json({ name: "LeadFlow API", status: "running" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "leadflow-api" });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/leads", require("./routes/leadRoutes"));
app.use("/api/clients", require("./routes/clientRoutes"));
app.use("/api/documents", require("./routes/documentRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/task-rules", require("./routes/taskRuleRoutes"));
app.use("/api/email-templates", require("./routes/emailRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/webhooks", require("./routes/webhookRoutes"));

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("joinBrokerage", (brokerageId) => {
    if (brokerageId) {
      socket.join(`brokerage:${brokerageId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    startWorkers(io);

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`LeadFlow API running on port ${PORT}`);
      console.log("Allowed frontend origins:", allowedOrigins);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();