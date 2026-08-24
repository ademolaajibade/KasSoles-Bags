const crypto = require("crypto");
const asyncHandler = require("express-async-handler");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { initializeTransaction, verifyTransaction } = require("../utils/paystack");

// Owner (logged in), or a guest matching the order's email via ?email=/body.email.
function canAccessOrder(order, req) {
  if (req.user && order.user && order.user.toString() === req.user._id.toString()) return true;
  const email = (req.query.email || req.body.email || "").toLowerCase().trim();
  return !!email && email === order.email;
}

async function restockOrder(order) {
  await Promise.all(
    order.items.map((item) =>
      Product.updateOne(
        { _id: item.product, "variants.sku": item.variantSku },
        { $inc: { "variants.$.stockQuantity": item.quantity } }
      )
    )
  );
}

async function markOrderPaid(order) {
  if (order.status === "paid") return;
  order.status = "paid";
  order.paidAt = new Date();
  await order.save();
}

// Stock was reserved at order creation, so a failed/abandoned payment must release it.
async function markOrderFailed(order) {
  if (order.status !== "pending") return;
  order.status = "cancelled";
  await restockOrder(order);
  await order.save();
}

// POST /api/payments/init
const initializePayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.body.orderId);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (!canAccessOrder(order, req)) {
    res.status(403);
    throw new Error("Not authorized to pay for this order");
  }

  if (order.status !== "pending") {
    res.status(409);
    throw new Error(`Order is already ${order.status}`);
  }

  const reference = `${order._id}-${Date.now()}`;
  const transaction = await initializeTransaction({
    email: order.email,
    amount: order.total,
    reference,
    callback_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/checkout/verify`,
    metadata: { orderId: order._id.toString() },
  });

  order.paystackReference = reference;
  await order.save();

  res.json({ success: true, authorizationUrl: transaction.authorization_url, reference });
});

// GET /api/payments/verify/:reference
const verifyPayment = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ paystackReference: req.params.reference });
  if (!order) {
    res.status(404);
    throw new Error("Order not found for this reference");
  }

  if (!canAccessOrder(order, req)) {
    res.status(403);
    throw new Error("Not authorized to view this order");
  }

  const transaction = await verifyTransaction(req.params.reference);

  if (transaction.status === "success") {
    await markOrderPaid(order);
  } else if (["failed", "abandoned"].includes(transaction.status)) {
    await markOrderFailed(order);
  }

  res.json({ success: true, order });
});

// POST /api/payments/webhook (raw body — see app.js)
const paystackWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-paystack-signature"];
  const expected = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(req.body)
    .digest("hex");

  if (signature !== expected) {
    res.status(401);
    throw new Error("Invalid webhook signature");
  }

  const event = JSON.parse(req.body.toString("utf8"));
  const reference = event.data?.reference;
  const order = reference && (await Order.findOne({ paystackReference: reference }));

  if (order) {
    if (event.event === "charge.success") {
      await markOrderPaid(order);
    } else if (event.event === "charge.failed") {
      await markOrderFailed(order);
    }
  }

  res.sendStatus(200);
});

module.exports = { initializePayment, verifyPayment, paystackWebhook };
