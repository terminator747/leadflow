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

// Frontend URLs allowed to access this backend
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow requests without an Origin header (for example, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

// Socket.IO configuration
const io = new Server(server, {
  cors: corsOptions
});

app.set("io", io);

// CORS must run before the API routes.
// This also handles browser OPTIONS preflight requests.
app.use(cors(corsOptions));

app.use(express.json());

// Create uploads directory
const uploadsDir = path.join(process.cwd(), "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

// Basic routes
app.get("/", (req, res) => {
  res.json({
    name: "LeadFlow API",
    status: "running"
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "leadflow-api"
  });
});

// API routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/leads", require("./routes/leadRoutes"));
app.use("/api/clients", require("./routes/clientRoutes"));
app.use("/api/documents", require("./routes/documentRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/task-rules", require("./routes/taskRuleRoutes"));
app.use("/api/email-templates", require("./routes/emailRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/webhooks", require("./routes/webhookRoutes"));

// Socket.IO events
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

// Error handler must come after routes
app.use(errorHandler);

// Render provides PORT automatically
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