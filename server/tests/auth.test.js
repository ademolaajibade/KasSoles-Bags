const request = require("supertest");
const app = require("../src/app");
const db = require("./dbHandler");
const User = require("../src/models/User");

beforeAll(async () => db.connect());
afterEach(async () => db.clearDatabase());
afterAll(async () => db.closeDatabase());

describe("POST /api/auth/register", () => {
  it("creates a user and returns an access token plus a refresh cookie", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ email: "ada@example.com", role: "customer" });
    expect(res.headers["set-cookie"].some((c) => c.startsWith("refreshToken="))).toBe(true);
  });

  it("rejects missing fields", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "a@b.com" });
    expect(res.status).toBe(400);
  });

  it("rejects a password under 8 characters", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Ada", email: "ada@example.com", password: "short" });
    expect(res.status).toBe(400);
  });

  it("rejects a duplicate email", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Ada", email: "ada@example.com", password: "password123" });

    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Ada Two", email: "ada@example.com", password: "password123" });

    expect(res.status).toBe(409);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Ada", email: "ada@example.com", password: "password123" });
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
  });

  it("rejects a wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "wrongpass" });
    expect(res.status).toBe(401);
  });

  it("rejects an unknown email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "password123" });
    expect(res.status).toBe(401);
  });
});

describe("refresh / logout", () => {
  it("issues a new access token from the refresh cookie", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/register")
      .send({ name: "Ada", email: "ada@example.com", password: "password123" });

    const res = await agent.post("/api/auth/refresh");
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
  });

  it("rejects a refresh call with no cookie", async () => {
    const res = await request(app).post("/api/auth/refresh");
    expect(res.status).toBe(401);
  });

  it("invalidates the refresh token on logout via tokenVersion", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/register")
      .send({ name: "Ada", email: "ada@example.com", password: "password123" });

    const logoutRes = await agent.post("/api/auth/logout");
    expect(logoutRes.status).toBe(200);

    const refreshRes = await agent.post("/api/auth/refresh");
    expect(refreshRes.status).toBe(401);

    const user = await User.findOne({ email: "ada@example.com" }).select("+tokenVersion");
    expect(user.tokenVersion).toBe(1);
  });
});
