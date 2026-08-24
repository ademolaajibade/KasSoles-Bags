const request = require("supertest");
const app = require("../src/app");
const db = require("./dbHandler");
const { createProduct } = require("./helpers");
const Cart = require("../src/models/Cart");

beforeAll(async () => db.connect());
afterEach(async () => db.clearDatabase());
afterAll(async () => db.closeDatabase());

describe("GET /api/shipping/quote", () => {
  it("returns the flat rate for a known state", async () => {
    const res = await request(app).get("/api/shipping/quote").query({ state: "Lagos" });
    expect(res.status).toBe(200);
    expect(res.body.shippingFee).toBe(200000);
  });

  it("is case-insensitive and trims whitespace", async () => {
    const res = await request(app).get("/api/shipping/quote").query({ state: "  lagos  " });
    expect(res.status).toBe(200);
    expect(res.body.shippingFee).toBe(200000);
  });

  it("falls back to the default fee (SHIPPING_FEE_KOBO) for an unlisted state", async () => {
    const res = await request(app).get("/api/shipping/quote").query({ state: "Borno" });
    expect(res.status).toBe(200);
    expect(res.body.shippingFee).toBe(200000);
  });

  it("rejects a missing state", async () => {
    const res = await request(app).get("/api/shipping/quote");
    expect(res.status).toBe(400);
  });
});

describe("shipping fee varies by state on order creation", () => {
  it("charges a different fee for a state outside the rate table", async () => {
    const product = await createProduct({
      variants: [{ sku: "SKU-A", size: "M", color: "Brown", price: 100000, stockQuantity: 5 }],
    });

    const sessionId = "test-session-shipping";
    await Cart.create({
      sessionId,
      items: [{ product: product._id, variantSku: "SKU-A", quantity: 1, priceAtAdd: 100000 }],
    });

    const res = await request(app)
      .post("/api/orders")
      .set("Cookie", [`cartSessionId=${sessionId}`])
      .send({
        email: "guest@example.com",
        shippingAddress: {
          fullName: "Ada Lovelace",
          phone: "08000000000",
          street: "1 Analytical Engine Way",
          city: "Kano",
          state: "Kano",
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.order.shippingFee).toBe(400000);
    expect(res.body.order.total).toBe(100000 + 400000);
  });
});
