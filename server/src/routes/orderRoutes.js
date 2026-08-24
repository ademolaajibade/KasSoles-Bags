const express = require("express");
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
} = require("../controllers/orderController");
const { protect, admin, optionalAuth } = require("../middleware/authMiddleware");
const { resolveCartSession } = require("../middleware/cartMiddleware");

const router = express.Router();

router.post("/", optionalAuth, resolveCartSession, createOrder);
router.get("/", protect, getOrders);
router.get("/:id", optionalAuth, getOrderById);
router.put("/:id/status", protect, admin, updateOrderStatus);

module.exports = router;
