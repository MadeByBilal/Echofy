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
const { initSocket, onlineUsers } = require("./socket/socket");

dotenv.config();

const app = express();
const server = http.createServer(app);
const allowedOrigins = (
  process.env.CORS_ORIGINS || "http://localhost:3001"
).split(",");

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/messages", messageRoutes);

// init socket
initSocket(io);

app.set("io", io);
app.set("onlineUsers", onlineUsers);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
