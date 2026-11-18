const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

const ALLOWED = ["name", "description", "price", "category", "imageUrl", "stock"];

// Keep only the fields we accept
function pickFields(body) {
  const data = {};
  ALLOWED.forEach((key) => {
    if (body && body[key] !== undefined) data[key] = body[key];
  });
  return data;
}

function validationMessage(err) {
  return Object.values(err.errors).map((e) => e.message).join(", ");
}

// Rejects bad ids before touching the database
function checkId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }
  next();
}

// GET /api/products  (public)
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/products/:id  (public)
router.get("/:id", checkId, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/products  (JWT + admin)
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.create(pickFields(req.body));
    res.status(201).json(product);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: validationMessage(err) });
    }
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid value for " + err.path });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/products/:id  (JWT + admin)
router.put("/:id", protect, adminOnly, checkId, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      pickFields(req.body),
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(product);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: validationMessage(err) });
    }
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid value for " + err.path });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/products/:id  (JWT + admin)
router.delete("/:id", protect, adminOnly, checkId, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
