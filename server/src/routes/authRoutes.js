const express = require("express");
const {
  register,
  login,
  refresh,
  logout,
  getMe,
  updateProfile,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { protect, admin } = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password/:token", authLimiter, resetPassword);

router.get("/me", protect, getMe);
router.put("/me", protect, updateProfile);
router.put("/password", protect, changePassword);
router.post("/addresses", protect, addAddress);
router.put("/addresses/:addressId", protect, updateAddress);
router.delete("/addresses/:addressId", protect, deleteAddress);

// GET /api/auth/admin-check — confirms `admin` role-check works. Temporary Phase 1
// verification route; real admin-only endpoints land in Phase 2 (products/categories).
router.get("/admin-check", protect, admin, (req, res) => {
  res.json({ success: true, message: "You are an admin" });
});

module.exports = router;
