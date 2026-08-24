const request = require("supertest");
const app = require("../src/app");
const db = require("./dbHandler");
const User = require("../src/models/User");
const { createUser } = require("./helpers");

beforeAll(async () => db.connect());
afterEach(async () => db.clearDatabase());
afterAll(async () => db.closeDatabase());

describe("PUT /api/auth/me", () => {
  it("updates name and phone", async () => {
    const { accessToken } = await createUser();
    const res = await request(app)
      .put("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "New Name", phone: "08011112222" });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ name: "New Name", phone: "08011112222" });
  });

  it("rejects an empty name", async () => {
    const { accessToken } = await createUser();
    const res = await request(app)
      .put("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "   " });
    expect(res.status).toBe(400);
  });

  it("requires authentication", async () => {
    const res = await request(app).put("/api/auth/me").send({ name: "New Name" });
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/auth/password", () => {
  it("rejects an incorrect current password", async () => {
    const { accessToken } = await createUser({ password: "password123" });
    const res = await request(app)
      .put("/api/auth/password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ currentPassword: "wrongpass", newPassword: "newpassword123" });
    expect(res.status).toBe(401);
  });

  it("rejects a new password under 8 characters", async () => {
    const { accessToken } = await createUser({ password: "password123" });
    const res = await request(app)
      .put("/api/auth/password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ currentPassword: "password123", newPassword: "short" });
    expect(res.status).toBe(400);
  });

  it("changes the password and bumps tokenVersion", async () => {
    const { user, accessToken } = await createUser({ password: "password123" });
    const res = await request(app)
      .put("/api/auth/password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ currentPassword: "password123", newPassword: "newpassword123" });

    expect(res.status).toBe(200);

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "newpassword123" });
    expect(login.status).toBe(200);

    const updated = await User.findById(user._id).select("+tokenVersion");
    expect(updated.tokenVersion).toBe(1);
  });
});

describe("address book", () => {
  it("rejects an incomplete address", async () => {
    const { accessToken } = await createUser();
    const res = await request(app)
      .post("/api/auth/addresses")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ fullName: "Ada" });
    expect(res.status).toBe(400);
  });

  it("adds, updates and deletes an address, keeping only one default", async () => {
    const { accessToken } = await createUser();
    const address = {
      fullName: "Ada Lovelace",
      phone: "08000000000",
      street: "1 Analytical Engine Way",
      city: "Lagos",
      state: "Lagos",
      isDefault: true,
    };

    const addRes = await request(app)
      .post("/api/auth/addresses")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(address);
    expect(addRes.status).toBe(201);
    expect(addRes.body.addresses).toHaveLength(1);
    expect(addRes.body.addresses[0].isDefault).toBe(true);

    const secondAddRes = await request(app)
      .post("/api/auth/addresses")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ...address, street: "2 Second St", isDefault: true });
    expect(secondAddRes.status).toBe(201);
    const [first, second] = secondAddRes.body.addresses;
    expect(first.isDefault).toBe(false);
    expect(second.isDefault).toBe(true);

    const updateRes = await request(app)
      .put(`/api/auth/addresses/${first._id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ city: "Abuja" });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.addresses.find((a) => a._id === first._id).city).toBe("Abuja");

    const deleteRes = await request(app)
      .delete(`/api/auth/addresses/${first._id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.addresses).toHaveLength(1);
  });

  it("404s updating/deleting an address that doesn't exist", async () => {
    const { accessToken } = await createUser();
    const res = await request(app)
      .put("/api/auth/addresses/64b7f3f3f3f3f3f3f3f3f3f3")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ city: "Abuja" });
    expect(res.status).toBe(404);
  });
});

describe("forgot / reset password", () => {
  it("responds the same way for an unknown email (no enumeration)", async () => {
    const res = await request(app).post("/api/auth/forgot-password").send({ email: "nobody@example.com" });
    expect(res.status).toBe(200);
  });

  it("sets a reset token on the user for a known email", async () => {
    const { user } = await createUser({ email: "ada@example.com" });
    const res = await request(app).post("/api/auth/forgot-password").send({ email: "ada@example.com" });
    expect(res.status).toBe(200);

    const updated = await User.findById(user._id).select("+passwordResetTokenHash +passwordResetExpires");
    expect(updated.passwordResetTokenHash).toBeTruthy();
    expect(updated.passwordResetExpires.getTime()).toBeGreaterThan(Date.now());
  });

  it("rejects an invalid or expired reset token", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password/not-a-real-token")
      .send({ newPassword: "newpassword123" });
    expect(res.status).toBe(400);
  });

  it("resets the password with a valid token and it becomes single-use", async () => {
    // Simulate the token mailer would have sent, using the same hashing the
    // controller uses, since forgotPassword doesn't expose the raw token in
    // its response (it would only ever go out over email in production).
    const crypto = require("crypto");
    const { user } = await createUser({ email: "ada@example.com", password: "password123" });
    const rawToken = "test-raw-token";
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    await User.findByIdAndUpdate(user._id, {
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: new Date(Date.now() + 30 * 60 * 1000),
    });

    const resetRes = await request(app)
      .post(`/api/auth/reset-password/${rawToken}`)
      .send({ newPassword: "brandnewpass" });
    expect(resetRes.status).toBe(200);

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "brandnewpass" });
    expect(login.status).toBe(200);

    const reuseRes = await request(app)
      .post(`/api/auth/reset-password/${rawToken}`)
      .send({ newPassword: "anotherpass123" });
    expect(reuseRes.status).toBe(400);
  });
});
