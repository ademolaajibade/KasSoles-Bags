// Demo-only testimonial data for the homepage. Users are clearly marked
// (demo.kas.local emails) so they're easy to find and remove later.
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("../src/config/db");
const User = require("../src/models/User");
const Product = require("../src/models/Product");
const Review = require("../src/models/Review");

const demoReviewers = [
  { name: "Amara Obi", email: "amara.obi@demo.kas.local" },
  { name: "Chidi Nnamdi", email: "chidi.nnamdi@demo.kas.local" },
  { name: "Fatima Bello", email: "fatima.bello@demo.kas.local" },
  { name: "Tunde Alabi", email: "tunde.alabi@demo.kas.local" },
  { name: "Ngozi Eze", email: "ngozi.eze@demo.kas.local" },
];

const demoReviewsData = [
  {
    product: "Woven Leather Tote",
    reviewer: "Amara Obi",
    rating: 5,
    comment: "The leather feels incredible and the stitching is so precise — you can tell it was made by hand. Gets compliments every time I carry it.",
  },
  {
    product: "Classic Leather Sneakers",
    reviewer: "Chidi Nnamdi",
    rating: 5,
    comment: "Fits true to size and broke in within a couple of days. Way more comfortable than anything I've bought off the shelf.",
  },
  {
    product: "Ankara Print Slippers",
    reviewer: "Fatima Bello",
    rating: 5,
    comment: "So soft and the print is even prettier in person. I've already ordered a second pair as a gift.",
  },
  {
    product: "Men's Leather Loafers",
    reviewer: "Tunde Alabi",
    rating: 4,
    comment: "Great craftsmanship and the leather smell is unreal. Sizing runs slightly narrow, so I'd size up if you have wider feet.",
  },
  {
    product: "Woven Sandals",
    reviewer: "Ngozi Eze",
    rating: 5,
    comment: "Lightweight, well-woven, and true to the photos. Shipping was fast and the packaging felt premium.",
  },
  {
    product: "Heeled Leather Sandals",
    reviewer: "Amara Obi",
    rating: 4,
    comment: "Beautiful heel height — dressy without being uncomfortable. Would love to see more color options.",
  },
  {
    product: "Beaded Crossbody Bag",
    reviewer: "Ngozi Eze",
    rating: 5,
    comment: "Perfect size for everyday use and the beadwork is flawless. Already my most-used bag.",
  },
];

async function seedReviews() {
  await connectDB();

  const passwordHash = await bcrypt.hash("Demo1234!", 10);
  const reviewerDocs = {};
  for (const r of demoReviewers) {
    let doc = await User.findOne({ email: r.email });
    if (!doc) {
      doc = await User.create({ name: r.name, email: r.email, passwordHash });
      console.log(`Created demo reviewer: ${r.name}`);
    }
    reviewerDocs[r.name] = doc;
  }

  for (const d of demoReviewsData) {
    const product = await Product.findOne({ name: d.product });
    if (!product) {
      console.log(`Skipping review — product not found: ${d.product}`);
      continue;
    }
    const user = reviewerDocs[d.reviewer];
    const exists = await Review.findOne({ product: product._id, user: user._id });
    if (exists) {
      console.log(`Skipping existing review: ${d.reviewer} -> ${d.product}`);
      continue;
    }
    await Review.create({
      product: product._id,
      user: user._id,
      rating: d.rating,
      comment: d.comment,
    });
    console.log(`Created review: ${d.reviewer} -> ${d.product}`);
  }

  await mongoose.disconnect();
  console.log("Done.");
}

seedReviews().catch((err) => {
  console.error(err);
  process.exit(1);
});
