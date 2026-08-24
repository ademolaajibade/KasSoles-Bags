const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true }, // snapshot
    variantSku: { type: String, required: true },
    size: { type: String, required: true },
    color: { type: String, required: true },
    image: { type: String },
    price: { type: Number, required: true, min: 0 }, // kobo, snapshot at purchase time
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    landmark: { type: String },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // Absent for guest checkout.
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    // Always present, for guest order confirmation/lookup and receipts.
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email address"],
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "Order must have at least one item",
      },
    },
    shippingAddress: { type: shippingAddressSchema, required: true },
    subtotal: { type: Number, required: true, min: 0 }, // kobo
    shippingFee: { type: Number, required: true, min: 0 }, // kobo
    total: { type: Number, required: true, min: 0 }, // kobo
    status: {
      type: String,
      enum: ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"],
      default: "pending",
    },
    paystackReference: { type: String, unique: true, sparse: true },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
