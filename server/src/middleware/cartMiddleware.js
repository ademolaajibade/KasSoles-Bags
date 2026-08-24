const crypto = require("crypto");

const CART_COOKIE_NAME = "cartSessionId";

function cartCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
  };
}

// Resolves the guest cart session id from a cookie, issuing one for new guests.
// Logged-in users carry forward an existing cookie (if any) so getOrCreateCart
// can merge a pre-login guest cart, but never get a fresh one issued.
function resolveCartSession(req, res, next) {
  const existing = req.cookies?.[CART_COOKIE_NAME];

  if (req.user) {
    req.cartSessionId = existing || null;
    return next();
  }

  req.cartSessionId = existing || crypto.randomUUID();
  if (!existing) {
    res.cookie(CART_COOKIE_NAME, req.cartSessionId, cartCookieOptions());
  }
  next();
}

module.exports = { resolveCartSession, CART_COOKIE_NAME, cartCookieOptions };
