const express = require("express");
const {
  getProductReviews,
  getFeaturedReviews,
  getAllReviews,
  createReview,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, admin, getAllReviews);
router.get("/featured", getFeaturedReviews);
router.get("/product/:productId", getProductReviews);
router.post("/product/:productId", protect, createReview);
router.put("/:id", protect, updateReview);
router.delete("/:id", protect, deleteReview);

module.exports = router;
