const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true }, // Cloudinary public_id, needed to delete/replace images later
  },
  { _id: false }
);

const variantSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, trim: true },
    size: { type: String, required: true },
    color: { type: String, required: true },
    price: { type: Number, required: true, min: 0 }, // kobo
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    gender: { type: String, enum: ["male", "female", "unisex"], required: true },
    images: [imageSchema],
    basePrice: { type: Number, required: true, min: 0 }, // kobo
    compareAtPrice: {
      type: Number,
      min: 0,
      validate: {
        validator: function (value) {
          return value == null || value > this.basePrice;
        },
        message: "compareAtPrice must be greater than basePrice",
      },
    },
    variants: {
      type: [variantSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "Product must have at least one variant",
      },
    },
    isHandmade: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ category: 1, gender: 1 });
productSchema.index({ "variants.sku": 1 }, { unique: true });

module.exports = mongoose.model("Product", productSchema);
