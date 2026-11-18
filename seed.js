// Run with: npm run seed
// Fills the database with sample books and creates the admin account.
require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Product = require("./models/Product");
const User = require("./models/User");

const img = (text) =>
  `https://placehold.co/300x400?text=${encodeURIComponent(text)}`;

const books = [
  { name: "The Stranger", description: "A classic novel by Albert Camus.", price: 1200, category: "Novels", stock: 15, imageUrl: img("The Stranger") },
  { name: "Nedjma", description: "A landmark Algerian novel by Kateb Yacine.", price: 1500, category: "Novels", stock: 10, imageUrl: img("Nedjma") },
  { name: "The Alchemist", description: "Paulo Coelho's story of following your dreams.", price: 1800, category: "Novels", stock: 20, imageUrl: img("The Alchemist") },
  { name: "Clean Code", description: "A handbook of agile software craftsmanship.", price: 4500, category: "Tech", stock: 8, imageUrl: img("Clean Code") },
  { name: "Python Crash Course", description: "A hands-on introduction to programming.", price: 3800, category: "Tech", stock: 12, imageUrl: img("Python") },
  { name: "Deep Learning", description: "The reference book on deep neural networks.", price: 6500, category: "Tech", stock: 5, imageUrl: img("Deep Learning") },
  { name: "The Little Prince", description: "A poetic tale by Antoine de Saint-Exupery.", price: 900, category: "Kids", stock: 25, imageUrl: img("Little Prince") },
  { name: "Matilda", description: "Roald Dahl's story of a gifted girl.", price: 1100, category: "Kids", stock: 18, imageUrl: img("Matilda") },
  { name: "Atomic Habits", description: "Tiny changes, remarkable results.", price: 2500, category: "Self-help", stock: 14, imageUrl: img("Atomic Habits") },
];

async function run() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, MONGODB_URI } = process.env;
  if (!MONGODB_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("MONGODB_URI, ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected");

  await Product.deleteMany({});
  await Product.insertMany(books);
  console.log(`${books.length} products inserted`);

  const email = ADMIN_EMAIL.toLowerCase();
  const exists = await User.findOne({ email });
  if (exists) {
    console.log("Admin already exists:", email);
  } else {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await User.create({ name: "Admin", email, passwordHash, role: "admin" });
    console.log("Admin created:", email);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
