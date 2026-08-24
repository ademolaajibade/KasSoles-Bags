const crypto = require("crypto");
const request = require("supertest");

jest.mock("../src/utils/paystack");
const paystack = require("../src/utils/paystack");
const app = require("../src/app");
const db = require("./dbHandler");
const Order = require("../src/models/Order");
const Product = require("../src/models/Product");
const { createProduct } = require("./helpers");

beforeAll(async () => db.connect());
afterEach(async () => db.clearDatabase());
afterAll(async () => db.closeDatabase());

const shippingAddress = {
  fullName: "Ada Lovelace",
  phone: "08000000000",
  street: "1 Analytical Engine Way",
  city: "Lagos",
  state: "Lagos",
};

async function createPendingOrder(product, { quantity = 1 } = {}) {
  const variant = product.variants[0];
  return Order.create({
    email: "guest@example.com",
    items: [
      {
        product: product._id,
        name: product.name,
        variantSku: variant.sku,
        size: variant.size,
        color: variant.color,
        price: variant.price,
        quantity,
      },
    ],
    shippingAddress,
    subtotal: variant.price * quantity,
    shippingFee: 200000,
    total: variant.price * quantity + 200000,
  });
}

function signWebhookBody(payload) {
  // Send the raw JSON string (not a Buffer) — supertest/superagent JSON-serializes
  // Buffer bodies as {"type":"Buffer","data":[...]} when Content-Type is JSON,
  // which would produce different bytes server-side than what we sign here.
  const body = JSON.stringify(payload);
  const signature = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(Buffer.from(body))
    .digest("hex");
  return { body, signature };
}

describe("POST /api/payments/init", () => {
  it("initializes a transaction for a pending order the requester owns", async () => {
    const product = await createProduct();
    const order = await createPendingOrder(product);

    paystack.initializeTransaction.mockResolvedValue({
      authorization_url: "https://paystack.test/pay/abc123",
    });

    const res = await request(app)
      .post("/api/payments/init")
      .send({ orderId: order._id, email: order.email });

    expect(res.status).toBe(200);
    expect(res.body.authorizationUrl).toBe("https://paystack.test/pay/abc123");

    const updated = await Order.findById(order._id);
    expect(updated.paystackReference).toBe(res.body.reference);
  });

  it("404s for an unknown order", async () => {
    const res = await request(app)
      .post("/api/payments/init")
      .send({ orderId: "64b7f3f3f3f3f3f3f3f3f3f3", email: "guest@example.com" });
    expect(res.status).toBe(404);
  });

  it("403s when the requester doesn't own the order", async () => {
    const product = await createProduct();
    const order = await createPendingOrder(product);

    const res = await request(app)
      .post("/api/payments/init")
      .send({ orderId: order._id, email: "someone-else@example.com" });
    expect(res.status).toBe(403);
  });

  it("409s when the order is no longer pending", async () => {
    const product = await createProduct();
    const order = await createPendingOrder(product);
    order.status = "paid";
    await order.save();

    const res = await request(app)
      .post("/api/payments/init")
      .send({ orderId: order._id, email: order.email });
    expect(res.status).toBe(409);
  });
});

describe("GET /api/payments/verify/:reference", () => {
  it("marks the order paid on a successful transaction", async () => {
    const product = await createProduct();
    const order = await createPendingOrder(product);
    order.paystackReference = "ref-success";
    await order.save();

    paystack.verifyTransaction.mockResolvedValue({ status: "success" });

    const res = await request(app)
      .get(`/api/payments/verify/ref-success`)
      .query({ email: order.email });

    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe("paid");
  });

  it("marks the order cancelled and restocks on a failed transaction", async () => {
    const product = await createProduct({
      variants: [{ sku: "SKU-A", size: "M", color: "Brown", price: 100000, stockQuantity: 3 }],
    });
    const order = await createPendingOrder(product, { quantity: 2 });
    order.paystackReference = "ref-failed";
    await order.save();
    // Stock was already decremented at order-creation time in the real flow;
    // mirror that here so we can assert it gets restored.
    await Product.updateOne({ _id: product._id }, { $set: { "variants.0.stockQuantity": 1 } });

    paystack.verifyTransaction.mockResolvedValue({ status: "failed" });

    const res = await request(app)
      .get(`/api/payments/verify/ref-failed`)
      .query({ email: order.email });

    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe("cancelled");

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.variants[0].stockQuantity).toBe(3);
  });
});

describe("POST /api/payments/webhook", () => {
  it("rejects a request with an invalid signature", async () => {
    const { body } = signWebhookBody({ event: "charge.success", data: { reference: "ref-x" } });

    const res = await request(app)
      .post("/api/payments/webhook")
      .set("Content-Type", "application/json")
      .set("x-paystack-signature", "not-the-right-signature")
      .send(body);

    expect(res.status).toBe(401);
  });

  it("marks the order paid on charge.success with a valid signature", async () => {
    const product = await createProduct();
    const order = await createPendingOrder(product);
    order.paystackReference = "ref-webhook-success";
    await order.save();

    const { body, signature } = signWebhookBody({
      event: "charge.success",
      data: { reference: "ref-webhook-success" },
    });

    const res = await request(app)
      .post("/api/payments/webhook")
      .set("Content-Type", "application/json")
      .set("x-paystack-signature", signature)
      .send(body);

    expect(res.status).toBe(200);
    const updated = await Order.findById(order._id);
    expect(updated.status).toBe("paid");
  });

  it("marks the order cancelled and restocks on charge.failed", async () => {
    const product = await createProduct({
      variants: [{ sku: "SKU-A", size: "M", color: "Brown", price: 100000, stockQuantity: 3 }],
    });
    const order = await createPendingOrder(product, { quantity: 2 });
    order.paystackReference = "ref-webhook-failed";
    await order.save();
    await Product.updateOne({ _id: product._id }, { $set: { "variants.0.stockQuantity": 1 } });

    const { body, signature } = signWebhookBody({
      event: "charge.failed",
      data: { reference: "ref-webhook-failed" },
    });

    const res = await request(app)
      .post("/api/payments/webhook")
      .set("Content-Type", "application/json")
      .set("x-paystack-signature", signature)
      .send(body);

    expect(res.status).toBe(200);
    const updated = await Order.findById(order._id);
    expect(updated.status).toBe("cancelled");

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.variants[0].stockQuantity).toBe(3);
  });
});
