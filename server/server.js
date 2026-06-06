const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const friendRoutes = require("./routes/friend.routes");
const messageRoutes = require("./routes/message.routes");
const notificationRoutes = require("./routes/notification.routes");
const groupRoutes = require("./routes/group.routes");
const webpush = require("web-push");
const { initSocket, onlineUsers } = require("./socket/socket");

dotenv.config();

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:echofy@app.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

const app = express();
const server = http.createServer(app);
const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  "http://localhost:3001,https://echofy20.vercel.app/"
).split(",").map((s) => s.trim().replace(/\/+$/, ""));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const normalised = origin.replace(/\/+$/, "");
      const allowed = allowedOrigins.some((o) => normalised === o);
      if (allowed) return cb(null, true);
      if (process.env.CORS_ORIGINS) {
        return cb(new Error("Not allowed by CORS"));
      }
      cb(null, true);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

connectDB();

// Test Route
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/groups", groupRoutes);

// init socket
initSocket(io);

app.set("io", io);
app.set("onlineUsers", onlineUsers);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
