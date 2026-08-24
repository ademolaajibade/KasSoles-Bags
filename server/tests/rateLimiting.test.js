const request = require("supertest");
const app = require("../src/app");
const db = require("./dbHandler");

beforeAll(async () => db.connect());
afterEach(async () => db.clearDatabase());
afterAll(async () => db.closeDatabase());

describe("rate limiting", () => {
  // The limiter is skipped when NODE_ENV === "test" (tests/env.js sets it) so
  // the rest of the suite isn't throttled by shared in-memory limiter state.
  // This test flips NODE_ENV for its own duration to confirm the limiter
  // actually engages outside test mode — a bug in the skip condition would
  // otherwise silently disable rate limiting in production too.
  it("blocks login after the configured number of attempts outside test env", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    try {
      let lastStatus;
      for (let i = 0; i < 11; i++) {
        const res = await request(app)
          .post("/api/auth/login")
          .send({ email: "nobody@example.com", password: "wrongpass" });
        lastStatus = res.status;
      }
      expect(lastStatus).toBe(429);
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});
