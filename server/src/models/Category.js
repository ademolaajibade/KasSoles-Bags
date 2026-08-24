const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    gender: { type: String, enum: ["male", "female", "unisex"], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
