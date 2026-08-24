const request = require("supertest");
const app = require("../src/app");
const db = require("./dbHandler");
const { createAdmin, createCategory, createProduct } = require("./helpers");

beforeAll(async () => db.connect());
afterEach(async () => db.clearDatabase());
afterAll(async () => db.closeDatabase());

describe("product compareAtPrice", () => {
  it("creates a product with a compareAtPrice greater than basePrice", async () => {
    const { accessToken } = await createAdmin();
    const category = await createCategory();

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${accessToken}`)
      .field("name", "Sale Tote")
      .field("category", String(category._id))
      .field("gender", "unisex")
      .field("basePrice", "400000")
      .field("compareAtPrice", "500000")
      .field(
        "variants",
        JSON.stringify([
          { sku: "SALE-1", size: "M", color: "Brown", price: 400000, stockQuantity: 5 },
        ])
      );

    expect(res.status).toBe(201);
    expect(res.body.product.compareAtPrice).toBe(500000);
  });

  it("rejects a compareAtPrice that is not greater than basePrice", async () => {
    const { accessToken } = await createAdmin();
    const category = await createCategory();

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${accessToken}`)
      .field("name", "Bad Sale Tote")
      .field("category", String(category._id))
      .field("gender", "unisex")
      .field("basePrice", "400000")
      .field("compareAtPrice", "400000")
      .field(
        "variants",
        JSON.stringify([
          { sku: "SALE-2", size: "M", color: "Brown", price: 400000, stockQuantity: 5 },
        ])
      );

    expect(res.status).toBe(400);
  });

  it("omits compareAtPrice when not provided", async () => {
    const { accessToken } = await createAdmin();
    const category = await createCategory();

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${accessToken}`)
      .field("name", "Regular Tote")
      .field("category", String(category._id))
      .field("gender", "unisex")
      .field("basePrice", "400000")
      .field(
        "variants",
        JSON.stringify([
          { sku: "REG-1", size: "M", color: "Brown", price: 400000, stockQuantity: 5 },
        ])
      );

    expect(res.status).toBe(201);
    expect(res.body.product.compareAtPrice).toBeUndefined();
  });

  it("updates a product to set and then clear compareAtPrice", async () => {
    const { accessToken } = await createAdmin();
    const product = await createProduct({ basePrice: 400000 });

    const setRes = await request(app)
      .put(`/api/products/${product._id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .field("compareAtPrice", "600000");
    expect(setRes.status).toBe(200);
    expect(setRes.body.product.compareAtPrice).toBe(600000);

    const clearRes = await request(app)
      .put(`/api/products/${product._id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .field("compareAtPrice", "");
    expect(clearRes.status).toBe(200);
    expect(clearRes.body.product.compareAtPrice).toBeUndefined();
  });
});
