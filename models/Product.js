const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "name is required"], trim: true },
    description: { type: String, default: "" },
    price: {
      type: Number,
      required: [true, "price is required"],
      min: [0, "price must be positive"],
    },
    category: { type: String, default: "General", trim: true },
    imageUrl: { type: String, default: "" },
    stock: { type: Number, default: 0, min: [0, "stock cannot be negative"] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
