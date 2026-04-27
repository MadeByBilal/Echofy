const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
dotenv.config(); // loads .env variables.

const app = express();

// middleware
app.use(
  cors({
    origin: "http://localhost:3001", // only allow our specific frontend url
    credentials: true,
  }),
);
app.use(express.json()); // read json from the request body.
app.use(cookieParser());

// connect to database
connectDB();

// test route
app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
