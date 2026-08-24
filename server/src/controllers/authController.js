const crypto = require("crypto");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { sendMail } = require("../utils/mailer");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
} = require("../utils/tokenUtils");

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    addresses: user.addresses,
  };
}

function hashResetToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email and password are required");
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error("Password must be at least 8 characters");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(409);
    throw new Error("Email already in use");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, phone });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());

  res.status(201).json({ success: true, accessToken, user: sanitizeUser(user) });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash +tokenVersion");
  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());

  res.json({ success: true, accessToken, user: sanitizeUser(user) });
});

// POST /api/auth/refresh
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) {
    res.status(401);
    throw new Error("No refresh token provided");
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    res.status(401);
    throw new Error("Invalid or expired refresh token");
  }

  const user = await User.findById(decoded.id).select("+tokenVersion");
  if (!user || user.tokenVersion !== decoded.tokenVersion) {
    res.status(401);
    throw new Error("Refresh token no longer valid");
  }

  const accessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);
  res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, refreshCookieOptions());

  res.json({ success: true, accessToken, user: sanitizeUser(user) });
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];

  if (token) {
    try {
      const decoded = verifyRefreshToken(token);
      // Bump tokenVersion so this (and any other outstanding) refresh token is invalidated.
      await User.findByIdAndUpdate(decoded.id, { $inc: { tokenVersion: 1 } });
    } catch {
      // Token already invalid/expired — nothing to revoke.
    }
  }

  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
  res.json({ success: true, message: "Logged out" });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: sanitizeUser(req.user) });
});

// PUT /api/auth/me
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  if (name !== undefined) {
    if (!name.trim()) {
      res.status(400);
      throw new Error("Name cannot be empty");
    }
    req.user.name = name;
  }
  if (phone !== undefined) req.user.phone = phone;

  await req.user.save();
  res.json({ success: true, user: sanitizeUser(req.user) });
});

// PUT /api/auth/password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("Current and new password are required");
  }
  if (newPassword.length < 8) {
    res.status(400);
    throw new Error("New password must be at least 8 characters");
  }

  const user = await User.findById(req.user._id).select("+passwordHash +tokenVersion");
  const match = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!match) {
    res.status(401);
    throw new Error("Current password is incorrect");
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.tokenVersion += 1; // invalidate outstanding refresh tokens on every device
  await user.save();

  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
  res.json({ success: true, message: "Password updated" });
});

// POST /api/auth/addresses
const addAddress = asyncHandler(async (req, res) => {
  const { label, fullName, phone, street, city, state, landmark, isDefault } = req.body;
  if (!fullName || !phone || !street || !city || !state) {
    res.status(400);
    throw new Error("fullName, phone, street, city and state are required");
  }

  if (isDefault) req.user.addresses.forEach((a) => (a.isDefault = false));
  req.user.addresses.push({ label, fullName, phone, street, city, state, landmark, isDefault: !!isDefault });
  await req.user.save();

  res.status(201).json({ success: true, addresses: req.user.addresses });
});

// PUT /api/auth/addresses/:addressId
const updateAddress = asyncHandler(async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) {
    res.status(404);
    throw new Error("Address not found");
  }

  const { label, fullName, phone, street, city, state, landmark, isDefault } = req.body;
  if (label !== undefined) address.label = label;
  if (fullName !== undefined) address.fullName = fullName;
  if (phone !== undefined) address.phone = phone;
  if (street !== undefined) address.street = street;
  if (city !== undefined) address.city = city;
  if (state !== undefined) address.state = state;
  if (landmark !== undefined) address.landmark = landmark;
  if (isDefault) {
    req.user.addresses.forEach((a) => (a.isDefault = false));
    address.isDefault = true;
  } else if (isDefault === false) {
    address.isDefault = false;
  }

  await req.user.save();
  res.json({ success: true, addresses: req.user.addresses });
});

// DELETE /api/auth/addresses/:addressId
const deleteAddress = asyncHandler(async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) {
    res.status(404);
    throw new Error("Address not found");
  }

  address.deleteOne();
  await req.user.save();
  res.json({ success: true, addresses: req.user.addresses });
});

// POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const email = (req.body.email || "").toLowerCase().trim();
  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  const user = await User.findOne({ email });
  // Always respond the same way, whether or not the email exists, so this
  // endpoint can't be used to enumerate registered accounts.
  if (user) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetTokenHash = hashResetToken(rawToken);
    user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/reset-password/${rawToken}`;
    await sendMail({
      to: user.email,
      subject: "Reset your Kas password",
      html: `<p>Click the link below to reset your password. This link expires in 30 minutes.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });
  }

  res.json({ success: true, message: "If that email is registered, a reset link has been sent" });
});

// POST /api/auth/reset-password/:token
const resetPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    res.status(400);
    throw new Error("New password must be at least 8 characters");
  }

  const tokenHash = hashResetToken(req.params.token);
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetTokenHash +passwordResetExpires +tokenVersion");

  if (!user) {
    res.status(400);
    throw new Error("Reset link is invalid or has expired");
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  user.tokenVersion += 1;
  await user.save();

  res.json({ success: true, message: "Password has been reset" });
});

module.exports = {
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
};
