import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("apiFetch", () => {
  let apiFetch, setAccessToken, ApiError;

  beforeEach(async () => {
    vi.resetModules();
    ({ apiFetch, setAccessToken, ApiError } = await import("@/lib/api"));
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends a JSON body and Authorization header when a token is set", async () => {
    setAccessToken("abc123");
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    await apiFetch("/cart/items", { method: "POST", body: { productId: "p1" } });

    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain("/cart/items");
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe("Bearer abc123");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(options.body).toBe(JSON.stringify({ productId: "p1" }));
    expect(options.credentials).toBe("include");
  });

  it("omits the Authorization header when no token is set", async () => {
    global.fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    await apiFetch("/products");
    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
  });

  it("throws an ApiError with the response status and message on failure", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: "Not found" }),
    });

    await expect(apiFetch("/orders/missing")).rejects.toMatchObject({
      message: "Not found",
      status: 404,
    });
    await expect(apiFetch("/orders/missing")).rejects.toBeInstanceOf(ApiError);
  });

  it("retries once after a silent refresh on 401, then succeeds", async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) }) // initial call
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ accessToken: "new-token" }) }) // refresh
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ cart: { items: [] } }) }); // retried call

    const data = await apiFetch("/cart");

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch.mock.calls[1][0]).toContain("/auth/refresh");
    expect(data).toEqual({ cart: { items: [] } });
  });

  it("does not retry the refresh call itself on a 401", async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });

    await expect(apiFetch("/auth/refresh", { method: "POST" })).rejects.toThrow();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
