const request = require("supertest");
const app = require("../src/app");
const db = require("./dbHandler");

beforeAll(async () => db.connect());
afterEach(async () => db.clearDatabase());
afterAll(async () => db.closeDatabase());

describe("POST /api/contact", () => {
  it("accepts a valid message", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ name: "Ada Lovelace", email: "ada@example.com", message: "Do you ship internationally?" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("rejects a missing message", async () => {
    const res = await request(app).post("/api/contact").send({ name: "Ada", email: "ada@example.com" });
    expect(res.status).toBe(400);
  });

  it("rejects a missing email", async () => {
    const res = await request(app).post("/api/contact").send({ name: "Ada", message: "Hello" });
    expect(res.status).toBe(400);
  });
});
