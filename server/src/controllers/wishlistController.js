const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const User = require("../models/User");

// GET /api/wishlist
const getWishlist = asyncHandler(async (req, res) => {
  await req.user.populate({
    path: "wishlist",
    select: "name slug images basePrice isActive",
  });

  res.json({ success: true, products: req.user.wishlist });
});

// POST /api/wishlist/:productId
const addToWishlist = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  await User.findByIdAndUpdate(req.user._id, { $addToSet: { wishlist: product._id } });
  res.status(201).json({ success: true });
});

// DELETE /api/wishlist/:productId
const removeFromWishlist = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $pull: { wishlist: req.params.productId } });
  res.json({ success: true });
});

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
