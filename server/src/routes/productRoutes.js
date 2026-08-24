const express = require("express");
const {
  getProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
} = require("../controllers/productController");
const { protect, admin, optionalAuth } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", optionalAuth, getProducts);
router.get("/id/:id", protect, admin, getProductById);
router.get("/:slug", getProductBySlug);
router.post("/", protect, admin, upload.array("images", 6), createProduct);
router.put("/:id", protect, admin, upload.array("images", 6), updateProduct);
router.delete("/:id/images", protect, admin, deleteProductImage);
router.delete("/:id", protect, admin, deleteProduct);

module.exports = router;
