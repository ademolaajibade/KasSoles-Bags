const request = require("supertest");
const app = require("../src/app");
const db = require("./dbHandler");
const Review = require("../src/models/Review");
const { createProduct, createUser, createAdmin } = require("./helpers");

beforeAll(async () => db.connect());
afterEach(async () => db.clearDatabase());
afterAll(async () => db.closeDatabase());

describe("GET /api/reviews (admin)", () => {
  it("is rejected for non-admins", async () => {
    const { accessToken } = await createUser();
    const res = await request(app).get("/api/reviews").set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(403);
  });

  it("lists reviews across products for admins", async () => {
    const product = await createProduct();
    const { user } = await createUser();
    await Review.create({ product: product._id, user: user._id, rating: 4, comment: "Nice bag" });

    const { accessToken: adminToken } = await createAdmin();
    const res = await request(app).get("/api/reviews").set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.reviews).toHaveLength(1);
    expect(res.body.reviews[0].comment).toBe("Nice bag");
    expect(res.body.pagination.total).toBe(1);
  });
});

describe("GET /api/reviews/featured", () => {
  it("returns only highly-rated reviews with a comment, without requiring auth", async () => {
    const product = await createProduct();
    const { user: userA } = await createUser();
    const { user: userB } = await createUser();
    const { user: userC } = await createUser();
    await Review.create({ product: product._id, user: userA._id, rating: 5, comment: "Beautiful craftsmanship" });
    await Review.create({ product: product._id, user: userB._id, rating: 2, comment: "Not great" });
    await Review.create({ product: product._id, user: userC._id, rating: 5, comment: "" });

    const res = await request(app).get("/api/reviews/featured");

    expect(res.status).toBe(200);
    expect(res.body.reviews).toHaveLength(1);
    expect(res.body.reviews[0].comment).toBe("Beautiful craftsmanship");
    expect(res.body.reviews[0].product.name).toBe(product.name);
  });

  it("caps results at the requested limit", async () => {
    const product = await createProduct();
    for (let i = 0; i < 3; i += 1) {
      const { user } = await createUser();
      await Review.create({ product: product._id, user: user._id, rating: 5, comment: `Great #${i}` });
    }

    const res = await request(app).get("/api/reviews/featured?limit=2");

    expect(res.status).toBe(200);
    expect(res.body.reviews).toHaveLength(2);
  });
});

describe("DELETE /api/reviews/:id", () => {
  it("lets the owner delete their own review", async () => {
    const product = await createProduct();
    const { user, accessToken } = await createUser();
    const review = await Review.create({ product: product._id, user: user._id, rating: 5 });

    const res = await request(app)
      .delete(`/api/reviews/${review._id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(await Review.findById(review._id)).toBeNull();
  });

  it("lets an admin delete someone else's review", async () => {
    const product = await createProduct();
    const { user } = await createUser();
    const review = await Review.create({ product: product._id, user: user._id, rating: 2, comment: "Meh" });

    const { accessToken: adminToken } = await createAdmin();
    const res = await request(app)
      .delete(`/api/reviews/${review._id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(await Review.findById(review._id)).toBeNull();
  });

  it("rejects deletion by an unrelated non-admin user", async () => {
    const product = await createProduct();
    const { user } = await createUser();
    const review = await Review.create({ product: product._id, user: user._id, rating: 3 });

    const { accessToken: strangerToken } = await createUser();
    const res = await request(app)
      .delete(`/api/reviews/${review._id}`)
      .set("Authorization", `Bearer ${strangerToken}`);
    expect(res.status).toBe(403);
    expect(await Review.findById(review._id)).not.toBeNull();
  });
});
