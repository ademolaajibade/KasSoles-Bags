const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variantSku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    priceAtAdd: { type: Number, required: true, min: 0 }, // kobo, snapshot at time item was added
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    sessionId: { type: String }, // for guest carts
    items: [cartItemSchema],
  },
  { timestamps: true }
);

cartSchema.pre("validate", function () {
  if (!this.user && !this.sessionId) {
    throw new Error("Cart requires either a user or a sessionId");
  }
});

cartSchema.index({ user: 1 }, { unique: true, sparse: true });
cartSchema.index({ sessionId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Cart", cartSchema);
