const Cart = require("../models/Cart");

async function findOrCreateCart(filter) {
  return Cart.findOneAndUpdate(filter, { $setOnInsert: filter }, { new: true, upsert: true });
}

// Resolves the current cart for a request: the user's cart if logged in
// (merging in any pre-login guest cart tied to req.cartSessionId), or the
// guest cart identified by req.cartSessionId otherwise.
async function getOrCreateCart(req) {
  if (req.user) {
    const cart = await findOrCreateCart({ user: req.user._id });

    if (req.cartSessionId) {
      const guestCart = await Cart.findOne({ sessionId: req.cartSessionId });
      if (guestCart && guestCart.items.length > 0) {
        guestCart.items.forEach((guestItem) => {
          const existing = cart.items.find(
            (item) =>
              item.product.toString() === guestItem.product.toString() &&
              item.variantSku === guestItem.variantSku
          );
          if (existing) {
            existing.quantity += guestItem.quantity;
          } else {
            cart.items.push(guestItem);
          }
        });
        await cart.save();
        await guestCart.deleteOne();
      }
    }

    return cart;
  }

  return findOrCreateCart({ sessionId: req.cartSessionId });
}

module.exports = { getOrCreateCart };
