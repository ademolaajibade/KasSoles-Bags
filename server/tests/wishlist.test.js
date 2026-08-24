const request = require("supertest");
const app = require("../src/app");
const db = require("./dbHandler");
const { createProduct, createUser } = require("./helpers");

beforeAll(async () => db.connect());
afterEach(async () => db.clearDatabase());
afterAll(async () => db.closeDatabase());

describe("wishlist", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/wishlist");
    expect(res.status).toBe(401);
  });

  it("adds a product, lists it, and removing it empties the list", async () => {
    const product = await createProduct();
    const { accessToken } = await createUser();

    const addRes = await request(app)
      .post(`/api/wishlist/${product._id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(addRes.status).toBe(201);

    const listRes = await request(app).get("/api/wishlist").set("Authorization", `Bearer ${accessToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.products).toHaveLength(1);
    expect(listRes.body.products[0].name).toBe(product.name);

    const removeRes = await request(app)
      .delete(`/api/wishlist/${product._id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(removeRes.status).toBe(200);

    const emptyListRes = await request(app).get("/api/wishlist").set("Authorization", `Bearer ${accessToken}`);
    expect(emptyListRes.body.products).toHaveLength(0);
  });

  it("does not duplicate an already-wishlisted product", async () => {
    const product = await createProduct();
    const { accessToken } = await createUser();

    await request(app).post(`/api/wishlist/${product._id}`).set("Authorization", `Bearer ${accessToken}`);
    await request(app).post(`/api/wishlist/${product._id}`).set("Authorization", `Bearer ${accessToken}`);

    const listRes = await request(app).get("/api/wishlist").set("Authorization", `Bearer ${accessToken}`);
    expect(listRes.body.products).toHaveLength(1);
  });

  it("404s adding a product that doesn't exist", async () => {
    const { accessToken } = await createUser();
    const res = await request(app)
      .post("/api/wishlist/64b7f3f3f3f3f3f3f3f3f3f3")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(404);
  });
});
