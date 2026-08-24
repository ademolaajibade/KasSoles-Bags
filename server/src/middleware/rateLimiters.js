const rateLimit = require("express-rate-limit");

// express-rate-limit's in-memory store is keyed per-process and never reset
// between tests, so a real limit would start rejecting requests partway
// through a big test file. Skip it in test; the limiting logic itself is
// express-rate-limit's, not ours, so there's nothing project-specific to test.
const skipInTest = () => process.env.NODE_ENV === "test";

// Brute-force-prone auth endpoints: login, register, forgot/reset password.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: { success: false, message: "Too many attempts, please try again later" },
});

// Payment initialization — cheap to call repeatedly, but each call hits Paystack.
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: { success: false, message: "Too many requests, please try again later" },
});

// Contact form — public and unauthenticated, so cap submissions to deter spam/abuse.
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: { success: false, message: "Too many messages, please try again later" },
});

module.exports = { authLimiter, paymentLimiter, contactLimiter };
