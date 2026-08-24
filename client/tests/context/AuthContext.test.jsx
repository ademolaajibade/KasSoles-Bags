import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/context/AuthContext";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
  setAccessToken: vi.fn(),
}));

import { apiFetch, setAccessToken } from "@/lib/api";

function Harness() {
  const { user, loading, login, register, logout } = useAuth();
  return (
    <div>
      <p data-testid="loading">{String(loading)}</p>
      <p data-testid="user">{user ? user.email : "none"}</p>
      <button onClick={() => login("ada@example.com", "password123")}>Login</button>
      <button onClick={() => register({ name: "Ada", email: "ada@example.com", password: "password123" })}>
        Register
      </button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AuthProvider", () => {
  it("silently refreshes on mount and populates the user on success", async () => {
    apiFetch.mockResolvedValueOnce({ accessToken: "tok", user: { email: "ada@example.com" } });

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    );

    expect(screen.getByTestId("loading").textContent).toBe("true");
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    expect(screen.getByTestId("user").textContent).toBe("ada@example.com");
    expect(apiFetch).toHaveBeenCalledWith("/auth/refresh", { method: "POST" });
    expect(setAccessToken).toHaveBeenCalledWith("tok");
  });

  it("stays logged out when the silent refresh fails", async () => {
    apiFetch.mockRejectedValueOnce(new Error("no session"));

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(screen.getByTestId("user").textContent).toBe("none");
  });

  it("login populates the user and sets the access token", async () => {
    apiFetch.mockRejectedValueOnce(new Error("no session")); // initial silent refresh
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    apiFetch.mockResolvedValueOnce({ accessToken: "tok2", user: { email: "ada@example.com" } });
    await act(() => user.click(screen.getByText("Login")));

    expect(apiFetch).toHaveBeenCalledWith("/auth/login", {
      method: "POST",
      body: { email: "ada@example.com", password: "password123" },
    });
    expect(screen.getByTestId("user").textContent).toBe("ada@example.com");
  });

  it("logout clears the user even if the API call rejects", async () => {
    apiFetch.mockResolvedValueOnce({ accessToken: "tok", user: { email: "ada@example.com" } });
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId("user").textContent).toBe("ada@example.com"));

    apiFetch.mockRejectedValueOnce(new Error("network down"));
    await act(() => user.click(screen.getByText("Logout")));

    expect(screen.getByTestId("user").textContent).toBe("none");
    expect(setAccessToken).toHaveBeenCalledWith(null);
  });
});
