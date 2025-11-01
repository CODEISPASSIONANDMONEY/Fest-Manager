const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
require("dotenv").config();

// Import database and models
const { sequelize, testConnection } = require("./config/database");
const { startCronJobs } = require("./services/cronJobs");

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const teamRoutes = require("./routes/teams");
const taskRoutes = require("./routes/tasks");
const commentRoutes = require("./routes/comments");
const notificationRoutes = require("./routes/notifications");
const analyticsRoutes = require("./routes/analytics");

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow inline scripts for development
  })
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Make io accessible in routes
app.set("io", io);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // Join user-specific room
  socket.on("join_user", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Join task-specific room
  socket.on("join_task", (taskId) => {
    socket.join(`task_${taskId}`);
    console.log(`User joined task room: ${taskId}`);
  });

  // Leave task room
  socket.on("leave_task", (taskId) => {
    socket.leave(`task_${taskId}`);
    console.log(`User left task room: ${taskId}`);
  });

  // Join team room
  socket.on("join_team", (teamId) => {
    socket.join(`team_${teamId}`);
    console.log(`User joined team room: ${teamId}`);
  });

  // Broadcast typing indicator for task comments
  socket.on("typing", ({ taskId, userName }) => {
    socket.to(`task_${taskId}`).emit("user_typing", { userName });
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("👋 User disconnected:", socket.id);
  });
});

// Initialize database and start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Test database connection
    const connected = await testConnection();

    if (!connected) {
      console.error(
        "❌ Cannot connect to database. Please check your configuration."
      );
      console.log("\nMake sure MySQL is running and the database exists:");
      console.log("  1. Start MySQL service");
      console.log("  2. Create database: CREATE DATABASE fest_manager;");
      console.log("  3. Create user and grant privileges (see .env file)");
      process.exit(1);
    }

    // Sync database (create tables)
    await sequelize.sync({ alter: false });
    console.log("✅ Database synchronized");

    // Start cron jobs
    startCronJobs();

    // Start server
    server.listen(PORT, () => {
      console.log(`\n${"=".repeat(50)}`);
      console.log("🚀 Fest Manager server running on http://localhost:" + PORT);
      console.log("📊 Environment:", process.env.NODE_ENV || "development");
      console.log("🔌 Socket.IO: Enabled");
      console.log(`${"=".repeat(50)}\n`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Handle unhandled rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

// Start the server
startServer();

module.exports = { app, io };
