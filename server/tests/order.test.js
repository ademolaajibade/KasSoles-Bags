const request = require("supertest");
const app = require("../src/app");
const db = require("./dbHandler");
const Cart = require("../src/models/Cart");
const Product = require("../src/models/Product");
const Order = require("../src/models/Order");
const { createProduct, createUser, createAdmin } = require("./helpers");

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

async function addGuestItem(agent, product, variant, quantity = 1) {
  return agent
    .post("/api/cart/items")
    .send({ productId: product._id, variantSku: variant.sku, quantity });
}

describe("POST /api/orders", () => {
  it("creates an order for a guest, decrements stock, and empties the cart", async () => {
    const product = await createProduct({
      variants: [{ sku: "SKU-A", size: "M", color: "Brown", price: 300000, stockQuantity: 5 }],
    });
    const agent = request.agent(app);
    await addGuestItem(agent, product, product.variants[0], 2);

    const res = await agent.post("/api/orders").send({
      email: "guest@example.com",
      shippingAddress,
    });

    expect(res.status).toBe(201);
    expect(res.body.order.status).toBe("pending");
    expect(res.body.order.subtotal).toBe(600000);
    expect(res.body.order.total).toBe(600000 + 200000);

    const updated = await Product.findById(product._id);
    expect(updated.variants[0].stockQuantity).toBe(3);

    const cart = await Cart.findOne({ sessionId: { $ne: null } });
    expect(cart.items).toHaveLength(0);
  });

  it("rejects an empty cart", async () => {
    const agent = request.agent(app);
    const res = await agent.post("/api/orders").send({ email: "guest@example.com", shippingAddress });
    expect(res.status).toBe(400);
  });

  it("rejects a missing email", async () => {
    const product = await createProduct();
    const agent = request.agent(app);
    await addGuestItem(agent, product, product.variants[0]);

    const res = await agent.post("/api/orders").send({ shippingAddress });
    expect(res.status).toBe(400);
  });

  it("rejects an incomplete shipping address", async () => {
    const product = await createProduct();
    const agent = request.agent(app);
    await addGuestItem(agent, product, product.variants[0]);

    const res = await agent
      .post("/api/orders")
      .send({ email: "guest@example.com", shippingAddress: { fullName: "Ada" } });
    expect(res.status).toBe(400);
  });

  it("rolls back stock already reserved when a later item is out of stock", async () => {
    const productA = await createProduct({
      name: "Product A",
      variants: [{ sku: "SKU-A", size: "M", color: "Brown", price: 100000, stockQuantity: 5 }],
    });
    const productB = await createProduct({
      name: "Product B",
      variants: [{ sku: "SKU-B", size: "M", color: "Black", price: 100000, stockQuantity: 5 }],
    });

    const sessionId = "test-session-rollback";
    await Cart.create({
      sessionId,
      items: [
        { product: productA._id, variantSku: "SKU-A", quantity: 2, priceAtAdd: 100000 },
        { product: productB._id, variantSku: "SKU-B", quantity: 2, priceAtAdd: 100000 },
      ],
    });

    // Simulate stock for product B being depleted by another order placed
    // in between the cart being built and this checkout being submitted.
    await Product.updateOne({ _id: productB._id }, { $set: { "variants.0.stockQuantity": 1 } });

    const res = await request(app)
      .post("/api/orders")
      .set("Cookie", [`cartSessionId=${sessionId}`])
      .send({ email: "guest@example.com", shippingAddress });

    expect(res.status).toBe(409);

    const ordersCount = await Order.countDocuments();
    expect(ordersCount).toBe(0);

    const refreshedA = await Product.findById(productA._id);
    expect(refreshedA.variants[0].stockQuantity).toBe(5); // rolled back, not left at 3

    const refreshedB = await Product.findById(productB._id);
    expect(refreshedB.variants[0].stockQuantity).toBe(1); // untouched, it was the one that failed
  });
});

describe("order access control", () => {
  it("lets the owner and an admin view an order, but not another user", async () => {
    const { user, accessToken } = await createUser();
    const product = await createProduct();

    await Cart.create({
      user: user._id,
      items: [{ product: product._id, variantSku: product.variants[0].sku, quantity: 1, priceAtAdd: 500000 }],
    });

    const createRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ email: user.email, shippingAddress });
    const orderId = createRes.body.order._id;

    const ownerRes = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(ownerRes.status).toBe(200);

    const { accessToken: otherToken } = await createUser();
    const strangerRes = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${otherToken}`);
    expect(strangerRes.status).toBe(404);

    const { accessToken: adminToken } = await createAdmin();
    const adminRes = await request(app).get(`/api/orders/${orderId}`).set("Authorization", `Bearer ${adminToken}`);
    expect(adminRes.status).toBe(200);

    const guestWrongEmailRes = await request(app).get(`/api/orders/${orderId}`).query({ email: "wrong@example.com" });
    expect(guestWrongEmailRes.status).toBe(404);
  });
});

describe("PUT /api/orders/:id/status", () => {
  it("is rejected for non-admins and applies for admins, stamping paidAt", async () => {
    const product = await createProduct();
    const agent = request.agent(app);
    await addGuestItem(agent, product, product.variants[0]);
    const createRes = await agent.post("/api/orders").send({ email: "guest@example.com", shippingAddress });
    const orderId = createRes.body.order._id;

    const { accessToken: customerToken } = await createUser();
    const customerRes = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ status: "paid" });
    expect(customerRes.status).toBe(403);

    const { accessToken: adminToken } = await createAdmin();
    const adminRes = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "paid" });
    expect(adminRes.status).toBe(200);
    expect(adminRes.body.order.status).toBe("paid");
    expect(adminRes.body.order.paidAt).toBeTruthy();
  });

  it("rejects an invalid status", async () => {
    const product = await createProduct();
    const agent = request.agent(app);
    await addGuestItem(agent, product, product.variants[0]);
    const createRes = await agent.post("/api/orders").send({ email: "guest@example.com", shippingAddress });
    const orderId = createRes.body.order._id;

    const { accessToken: adminToken } = await createAdmin();
    const res = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "not-a-real-status" });
    expect(res.status).toBe(400);
  });
});
