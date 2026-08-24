const asyncHandler = require("express-async-handler");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { getOrCreateCart } = require("../utils/cartUtils");
const { getShippingFee } = require("../config/shippingRates");

const VALID_STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];

function sanitizeShippingAddress(body) {
  const { fullName, phone, street, city, state, landmark } = body || {};
  if (!fullName || !phone || !street || !city || !state) {
    return null;
  }
  return { fullName, phone, street, city, state, landmark };
}

// POST /api/orders
const createOrder = asyncHandler(async (req, res) => {
  const email = (req.body.email || req.user?.email || "").toLowerCase().trim();
  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  const shippingAddress = sanitizeShippingAddress(req.body.shippingAddress);
  if (!shippingAddress) {
    res.status(400);
    throw new Error("A complete shipping address is required");
  }

  const cart = await getOrCreateCart(req);
  if (cart.items.length === 0) {
    res.status(400);
    throw new Error("Cart is empty");
  }

  const orderItems = [];
  const reserved = [];

  try {
    for (const cartItem of cart.items) {
      const product = await Product.findById(cartItem.product);
      if (!product || !product.isActive) {
        res.status(409);
        throw new Error("A product in your cart is no longer available");
      }

      const variant = product.variants.find((v) => v.sku === cartItem.variantSku);
      if (!variant) {
        res.status(409);
        throw new Error("A product variant in your cart is no longer available");
      }

      // Atomic conditional decrement so concurrent checkouts can't oversell.
      const updated = await Product.findOneAndUpdate(
        {
          _id: product._id,
          "variants.sku": cartItem.variantSku,
          "variants.stockQuantity": { $gte: cartItem.quantity },
        },
        { $inc: { "variants.$.stockQuantity": -cartItem.quantity } },
        { new: true }
      );

      if (!updated) {
        res.status(409);
        throw new Error(`Insufficient stock for ${product.name} (${variant.size}/${variant.color})`);
      }

      reserved.push({ productId: product._id, variantSku: cartItem.variantSku, quantity: cartItem.quantity });

      orderItems.push({
        product: product._id,
        name: product.name,
        variantSku: variant.sku,
        size: variant.size,
        color: variant.color,
        image: product.images?.[0]?.url,
        price: variant.price,
        quantity: cartItem.quantity,
      });
    }
  } catch (err) {
    // Roll back any stock already reserved earlier in this loop.
    await Promise.all(
      reserved.map((r) =>
        Product.updateOne(
          { _id: r.productId, "variants.sku": r.variantSku },
          { $inc: { "variants.$.stockQuantity": r.quantity } }
        )
      )
    );
    throw err;
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = getShippingFee(shippingAddress.state);
  const total = subtotal + shippingFee;

  const order = await Order.create({
    user: req.user?._id || null,
    email,
    items: orderItems,
    shippingAddress,
    subtotal,
    shippingFee,
    total,
  });

  cart.items = [];
  await cart.save();

  res.status(201).json({ success: true, order });
});

// GET /api/orders
// Regular users get their own orders; an admin passing ?all=true gets every order.
const getOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));

  const filter = {};
  const wantsAll = req.user.role === "admin" && req.query.all === "true";
  if (!wantsAll) filter.user = req.user._id;
  if (status) filter.status = status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    orders,
    pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
  });
});

// GET /api/orders/:id
// Owner or admin can view via auth; a guest can look up their own order by
// matching the email it was placed with (?email=).
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const isOwner = req.user && order.user && order.user.toString() === req.user._id.toString();
  const isAdmin = req.user?.role === "admin";

  if (!isOwner && !isAdmin) {
    const email = (req.query.email || "").toLowerCase().trim();
    if (!email || email !== order.email) {
      res.status(404);
      throw new Error("Order not found");
    }
  }

  res.json({ success: true, order });
});

// PUT /api/orders/:id/status
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    res.status(400);
    throw new Error("Invalid status");
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  order.status = status;
  if (status === "paid" && !order.paidAt) order.paidAt = new Date();
  await order.save();

  res.json({ success: true, order });
});

module.exports = { createOrder, getOrders, getOrderById, updateOrderStatus };
