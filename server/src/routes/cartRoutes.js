const express = require("express");
const {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
} = require("../controllers/cartController");
const { optionalAuth } = require("../middleware/authMiddleware");
const { resolveCartSession } = require("../middleware/cartMiddleware");

const router = express.Router();

router.use(optionalAuth, resolveCartSession);

router.get("/", getCart);
router.post("/items", addItem);
router.put("/items/:itemId", updateItemQuantity);
router.delete("/items/:itemId", removeItem);
router.delete("/", clearCart);

module.exports = router;
