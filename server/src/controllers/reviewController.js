const asyncHandler = require("express-async-handler");
const Review = require("../models/Review");
const Product = require("../models/Product");

// GET /api/reviews/product/:productId
const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId })
    .populate("user", "name")
    .sort({ createdAt: -1 });

  const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  res.json({ success: true, reviews, average, count: reviews.length });
});

// GET /api/reviews/featured (public — highly-rated reviews for homepage testimonials)
const getFeaturedReviews = asyncHandler(async (req, res) => {
  const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 6));

  const reviews = await Review.find({ rating: { $gte: 4 }, comment: { $exists: true, $ne: "" } })
    .populate("user", "name")
    .populate("product", "name slug")
    .sort({ rating: -1, createdAt: -1 })
    .limit(limit);

  res.json({ success: true, reviews });
});

// GET /api/reviews (admin only)
const getAllReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  const [reviews, total] = await Promise.all([
    Review.find()
      .populate("user", "name email")
      .populate("product", "name slug")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Review.countDocuments(),
  ]);

  res.json({
    success: true,
    reviews,
    pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
  });
});

// POST /api/reviews/product/:productId
const createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    res.status(400);
    throw new Error("Rating must be between 1 and 5");
  }

  const product = await Product.findById(req.params.productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  let review;
  try {
    review = await Review.create({ product: product._id, user: req.user._id, rating, comment });
  } catch (err) {
    if (err.code === 11000) {
      res.status(409);
      throw new Error("You have already reviewed this product");
    }
    throw err;
  }

  await review.populate("user", "name");
  res.status(201).json({ success: true, review });
});

// PUT /api/reviews/:id
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }
  if (review.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to edit this review");
  }

  const { rating, comment } = req.body;
  if (rating !== undefined) {
    if (rating < 1 || rating > 5) {
      res.status(400);
      throw new Error("Rating must be between 1 and 5");
    }
    review.rating = rating;
  }
  if (comment !== undefined) review.comment = comment;

  await review.save();
  await review.populate("user", "name");
  res.json({ success: true, review });
});

// DELETE /api/reviews/:id
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  const isOwner = review.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to delete this review");
  }

  await review.deleteOne();
  res.json({ success: true, message: "Review deleted" });
});

module.exports = {
  getProductReviews,
  getFeaturedReviews,
  getAllReviews,
  createReview,
  updateReview,
  deleteReview,
};
