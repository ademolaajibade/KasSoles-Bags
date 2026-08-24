const request = require("supertest");
const app = require("../src/app");
const db = require("./dbHandler");
const Cart = require("../src/models/Cart");
const { createProduct } = require("./helpers");

beforeAll(async () => db.connect());
afterEach(async () => db.clearDatabase());
afterAll(async () => db.closeDatabase());

describe("guest cart", () => {
  it("adds an item and issues a cartSessionId cookie", async () => {
    const product = await createProduct();
    const variant = product.variants[0];

    const res = await request(app)
      .post("/api/cart/items")
      .send({ productId: product._id, variantSku: variant.sku, quantity: 2 });

    expect(res.status).toBe(201);
    expect(res.body.cart.itemCount).toBe(2);
    expect(res.headers["set-cookie"].some((c) => c.startsWith("cartSessionId="))).toBe(true);
  });

  it("rejects adding more than is in stock", async () => {
    const product = await createProduct({
      variants: [{ sku: "SKU-LOW", size: "M", color: "Black", price: 100000, stockQuantity: 1 }],
    });

    const res = await request(app)
      .post("/api/cart/items")
      .send({ productId: product._id, variantSku: "SKU-LOW", quantity: 2 });

    expect(res.status).toBe(409);
  });

  it("updates and removes an item, and clears the cart", async () => {
    const product = await createProduct();
    const variant = product.variants[0];
    const agent = request.agent(app);

    const addRes = await agent
      .post("/api/cart/items")
      .send({ productId: product._id, variantSku: variant.sku, quantity: 1 });
    const itemId = addRes.body.cart.items[0].id;

    const updateRes = await agent.put(`/api/cart/items/${itemId}`).send({ quantity: 3 });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.cart.itemCount).toBe(3);

    const overStockRes = await agent.put(`/api/cart/items/${itemId}`).send({ quantity: 999 });
    expect(overStockRes.status).toBe(409);

    const removeRes = await agent.delete(`/api/cart/items/${itemId}`);
    expect(removeRes.status).toBe(200);
    expect(removeRes.body.cart.items).toHaveLength(0);

    await agent.post("/api/cart/items").send({ productId: product._id, variantSku: variant.sku, quantity: 1 });
    const clearRes = await agent.delete("/api/cart");
    expect(clearRes.status).toBe(200);
    expect(clearRes.body.cart.items).toHaveLength(0);
  });
});

describe("cart merge on login", () => {
  it("merges a guest cart into the user's cart and deletes the guest cart", async () => {
    const product = await createProduct();
    const variant = product.variants[0];
    const agent = request.agent(app);

    // Guest adds an item before authenticating.
    await agent
      .post("/api/cart/items")
      .send({ productId: product._id, variantSku: variant.sku, quantity: 2 });

    const guestCartsBefore = await Cart.countDocuments({ sessionId: { $ne: null } });
    expect(guestCartsBefore).toBe(1);

    // Same agent (same cartSessionId cookie) now registers.
    const registerRes = await agent
      .post("/api/auth/register")
      .send({ name: "Ada", email: "ada@example.com", password: "password123" });
    const { accessToken } = registerRes.body;

    const cartRes = await agent.get("/api/cart").set("Authorization", `Bearer ${accessToken}`);

    expect(cartRes.status).toBe(200);
    expect(cartRes.body.cart.itemCount).toBe(2);
    expect(cartRes.body.cart.items).toHaveLength(1);

    const guestCartsAfter = await Cart.countDocuments({ sessionId: { $ne: null } });
    expect(guestCartsAfter).toBe(0);
  });

  it("combines quantities when the same variant exists in both carts", async () => {
    const product = await createProduct();
    const variant = product.variants[0];
    const agent = request.agent(app);

    const registerRes = await agent
      .post("/api/auth/register")
      .send({ name: "Ada", email: "ada@example.com", password: "password123" });
    const { accessToken } = registerRes.body;

    // Logged-in user adds an item first.
    await agent
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ productId: product._id, variantSku: variant.sku, quantity: 1 });

    // Log out (clears refresh cookie, but the client keeps sending the still-issued
    // access token below since this simulates a stale-token guest browsing session)
    // and add the same variant again without auth, using the same cartSessionId.
    await agent.post("/api/auth/logout");
    await agent
      .post("/api/cart/items")
      .send({ productId: product._id, variantSku: variant.sku, quantity: 3 });

    const cartRes = await agent.get("/api/cart").set("Authorization", `Bearer ${accessToken}`);
    expect(cartRes.body.cart.itemCount).toBe(4);
    expect(cartRes.body.cart.items).toHaveLength(1);
  });
});
