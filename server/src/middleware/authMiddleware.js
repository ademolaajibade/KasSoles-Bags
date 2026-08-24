const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const { verifyAccessToken } = require("../utils/tokenUtils");

// Attaches req.user if a valid access token is present, but never blocks the request.
const optionalAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;

  if (header && header.startsWith("Bearer ")) {
    try {
      const decoded = verifyAccessToken(header.split(" ")[1]);
      req.user = await User.findById(decoded.id);
    } catch {
      // Invalid/expired token — proceed unauthenticated rather than failing the request.
    }
  }

  next();
});

const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }

  const token = header.split(" ")[1];

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    res.status(401);
    throw new Error("Not authorized, invalid or expired token");
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    res.status(401);
    throw new Error("Not authorized, user no longer exists");
  }

  req.user = user;
  next();
});

function admin(req, res, next) {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  res.status(403);
  throw new Error("Not authorized as an admin");
}

module.exports = { protect, admin, optionalAuth };
