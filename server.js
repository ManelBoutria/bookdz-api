require("dotenv").config({ quiet: true });
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { apiLimiter } = require("./middleware/rateLimiters");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");

const app = express();

// Allow the React dev server (Vite) and any origin listed in CLIENT_ORIGIN
const origins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());
app.use(cors({ origin: origins }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "BookDZ API is running" });
});

// General rate limit on every API endpoint
app.use("/api", apiLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

// Unknown route
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Invalid JSON body and any other unexpected error
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON in request body" });
  }
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing in .env");
  process.exit(1);
}

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
