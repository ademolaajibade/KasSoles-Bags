const express = require("express");
const { initializePayment, verifyPayment } = require("../controllers/paymentController");
const { optionalAuth } = require("../middleware/authMiddleware");
const { paymentLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

router.post("/init", paymentLimiter, optionalAuth, initializePayment);
router.get("/verify/:reference", optionalAuth, verifyPayment);

module.exports = router;
