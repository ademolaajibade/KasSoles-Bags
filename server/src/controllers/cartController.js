const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const { getOrCreateCart } = require("../utils/cartUtils");

async function serializeCart(cart) {
  await cart.populate("items.product", "name slug images isActive variants");

  const items = cart.items.map((item) => {
    const product = item.product;
    const variant = product?.variants?.find((v) => v.sku === item.variantSku);

    return {
      id: item._id,
      product: product
        ? { id: product._id, name: product.name, slug: product.slug, image: product.images?.[0]?.url }
        : null,
      variantSku: item.variantSku,
      size: variant?.size,
      color: variant?.color,
      quantity: item.quantity,
      priceAtAdd: item.priceAtAdd,
      lineTotal: item.priceAtAdd * item.quantity,
      stockQuantity: variant?.stockQuantity ?? 0,
      available: Boolean(product?.isActive && variant && variant.stockQuantity >= item.quantity),
    };
  });

  return {
    id: cart._id,
    items,
    subtotal: items.reduce((sum, item) => sum + item.lineTotal, 0),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

// GET /api/cart
const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req);
  res.json({ success: true, cart: await serializeCart(cart) });
});

// POST /api/cart/items
const addItem = asyncHandler(async (req, res) => {
  const { productId, variantSku, quantity } = req.body;

  if (!productId || !variantSku || !quantity) {
    res.status(400);
    throw new Error("productId, variantSku and quantity are required");
  }
  if (Number(quantity) < 1) {
    res.status(400);
    throw new Error("Quantity must be at least 1");
  }

  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const variant = product.variants.find((v) => v.sku === variantSku);
  if (!variant) {
    res.status(404);
    throw new Error("Variant not found");
  }

  const cart = await getOrCreateCart(req);
  const existing = cart.items.find(
    (item) => item.product.toString() === productId && item.variantSku === variantSku
  );
  const desiredQuantity = (existing?.quantity || 0) + Number(quantity);

  if (desiredQuantity > variant.stockQuantity) {
    res.status(409);
    throw new Error(`Only ${variant.stockQuantity} in stock`);
  }

  if (existing) {
    existing.quantity = desiredQuantity;
  } else {
    cart.items.push({
      product: product._id,
      variantSku,
      quantity: Number(quantity),
      priceAtAdd: variant.price,
    });
  }

  await cart.save();
  res.status(201).json({ success: true, cart: await serializeCart(cart) });
});

// PUT /api/cart/items/:itemId
const updateItemQuantity = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || Number(quantity) < 1) {
    res.status(400);
    throw new Error("Quantity must be at least 1");
  }

  const cart = await getOrCreateCart(req);
  const item = cart.items.find((i) => i._id.toString() === req.params.itemId);
  if (!item) {
    res.status(404);
    throw new Error("Cart item not found");
  }

  const product = await Product.findById(item.product);
  const variant = product?.variants?.find((v) => v.sku === item.variantSku);
  if (!variant || variant.stockQuantity < Number(quantity)) {
    res.status(409);
    throw new Error(`Only ${variant?.stockQuantity ?? 0} in stock`);
  }

  item.quantity = Number(quantity);
  await cart.save();
  res.json({ success: true, cart: await serializeCart(cart) });
});

// DELETE /api/cart/items/:itemId
const removeItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req);
  const exists = cart.items.some((item) => item._id.toString() === req.params.itemId);
  if (!exists) {
    res.status(404);
    throw new Error("Cart item not found");
  }

  cart.items = cart.items.filter((item) => item._id.toString() !== req.params.itemId);
  await cart.save();
  res.json({ success: true, cart: await serializeCart(cart) });
});

// DELETE /api/cart
const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req);
  cart.items = [];
  await cart.save();
  res.json({ success: true, cart: await serializeCart(cart) });
});

module.exports = { getCart, addItem, updateItemQuantity, removeItem, clearCart };
