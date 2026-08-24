require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const Category = require("../src/models/Category");
const Product = require("../src/models/Product");
const { generateUniqueSlug } = require("../src/utils/slugify");

const categoriesData = [
  { name: "Bags", gender: "unisex" },
  { name: "Sneakers", gender: "unisex" },
  { name: "Slippers", gender: "unisex" },
  { name: "Sandals", gender: "female" },
];

// No real product photography yet — Lorem Picsum placeholders, seeded per
// product so each one gets a stable, distinct-looking image.
function placeholderImages(seed, count = 2) {
  return Array.from({ length: count }, (_, i) => ({
    url: `https://picsum.photos/seed/${seed}-${i}/800/800`,
    publicId: `seed/${seed}-${i}`,
  }));
}

const productsData = [
  {
    name: "Woven Leather Tote",
    category: "Bags",
    gender: "unisex",
    description: "Hand-stitched full-grain leather tote with a woven front panel and roomy interior.",
    variants: [
      { sku: "TOTE-BRN", size: "One Size", color: "Brown", price: 2500000, stockQuantity: 12 },
      { sku: "TOTE-BLK", size: "One Size", color: "Black", price: 2500000, stockQuantity: 10 },
      { sku: "TOTE-TAN", size: "One Size", color: "Tan", price: 2600000, stockQuantity: 8 },
    ],
  },
  {
    name: "Beaded Crossbody Bag",
    category: "Bags",
    gender: "female",
    description: "Compact crossbody bag with hand-beaded trim and an adjustable strap.",
    variants: [
      { sku: "CROSS-BLK", size: "One Size", color: "Black", price: 1800000, stockQuantity: 15 },
      { sku: "CROSS-RED", size: "One Size", color: "Red", price: 1800000, stockQuantity: 9 },
    ],
  },
  {
    name: "Classic Leather Sneakers",
    category: "Sneakers",
    gender: "unisex",
    description: "Hand-cut leather uppers on a cushioned rubber sole.",
    variants: [
      { sku: "SNK-BLK-40", size: "40", color: "Black", price: 3200000, stockQuantity: 6 },
      { sku: "SNK-BLK-42", size: "42", color: "Black", price: 3200000, stockQuantity: 7 },
      { sku: "SNK-BLK-44", size: "44", color: "Black", price: 3200000, stockQuantity: 5 },
      { sku: "SNK-WHT-41", size: "41", color: "White", price: 3300000, stockQuantity: 6 },
      { sku: "SNK-WHT-43", size: "43", color: "White", price: 3300000, stockQuantity: 6 },
    ],
  },
  {
    name: "Men's Leather Loafers",
    category: "Sneakers",
    gender: "male",
    description: "Slip-on loafers in soft handmade leather with a stitched sole.",
    variants: [
      { sku: "LOAF-BRN-41", size: "41", color: "Brown", price: 2900000, stockQuantity: 8 },
      { sku: "LOAF-BRN-43", size: "43", color: "Brown", price: 2900000, stockQuantity: 8 },
      { sku: "LOAF-BLK-42", size: "42", color: "Black", price: 2900000, stockQuantity: 7 },
    ],
  },
  {
    name: "Handmade Leather Slippers",
    category: "Slippers",
    gender: "unisex",
    description: "Everyday slip-ons cut and stitched from soft leather.",
    variants: [
      { sku: "SLIP-BRN-40", size: "40", color: "Brown", price: 1200000, stockQuantity: 20 },
      { sku: "SLIP-BRN-42", size: "42", color: "Brown", price: 1200000, stockQuantity: 18 },
      { sku: "SLIP-BLK-41", size: "41", color: "Black", price: 1200000, stockQuantity: 20 },
      { sku: "SLIP-BLK-43", size: "43", color: "Black", price: 1200000, stockQuantity: 15 },
    ],
  },
  {
    name: "Ankara Print Slippers",
    category: "Slippers",
    gender: "female",
    description: "Slippers finished with hand-sewn Ankara fabric trim.",
    variants: [
      { sku: "ANK-SLP-37", size: "37", color: "Multicolor", price: 1400000, stockQuantity: 14 },
      { sku: "ANK-SLP-38", size: "38", color: "Multicolor", price: 1400000, stockQuantity: 12 },
      { sku: "ANK-SLP-39", size: "39", color: "Multicolor", price: 1400000, stockQuantity: 10 },
    ],
  },
  {
    name: "Woven Sandals",
    category: "Sandals",
    gender: "female",
    description: "Open-toe sandals with a hand-woven strap design.",
    variants: [
      { sku: "SAND-TAN-37", size: "37", color: "Tan", price: 1600000, stockQuantity: 11 },
      { sku: "SAND-TAN-39", size: "39", color: "Tan", price: 1600000, stockQuantity: 9 },
      { sku: "SAND-BLK-38", size: "38", color: "Black", price: 1600000, stockQuantity: 10 },
    ],
  },
  {
    name: "Heeled Leather Sandals",
    category: "Sandals",
    gender: "female",
    description: "Block-heel sandals in hand-finished leather.",
    variants: [
      { sku: "HEEL-BLK-37", size: "37", color: "Black", price: 2100000, stockQuantity: 8 },
      { sku: "HEEL-BLK-39", size: "39", color: "Black", price: 2100000, stockQuantity: 7 },
      { sku: "HEEL-NUDE-38", size: "38", color: "Nude", price: 2100000, stockQuantity: 6 },
    ],
  },
];

function basePriceFor(variants) {
  return Math.min(...variants.map((v) => v.price));
}

async function seed() {
  await connectDB();

  const categoryDocs = {};
  for (const cat of categoriesData) {
    let doc = await Category.findOne({ name: cat.name });
    if (!doc) {
      const slug = await generateUniqueSlug(Category, cat.name);
      doc = await Category.create({ ...cat, slug });
      console.log(`Created category: ${cat.name}`);
    }
    categoryDocs[cat.name] = doc;
  }

  for (const p of productsData) {
    const exists = await Product.findOne({ name: p.name });
    if (exists) {
      console.log(`Skipping existing product: ${p.name}`);
      continue;
    }

    const slug = await generateUniqueSlug(Product, p.name);
    await Product.create({
      name: p.name,
      slug,
      description: p.description,
      category: categoryDocs[p.category]._id,
      gender: p.gender,
      basePrice: basePriceFor(p.variants),
      variants: p.variants,
      images: placeholderImages(slug),
      isHandmade: true,
      isActive: true,
    });
    console.log(`Created product: ${p.name}`);
  }

  await mongoose.disconnect();
  console.log("Done.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
