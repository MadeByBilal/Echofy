const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

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

// connect to database
connectDB();

// test route
app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
