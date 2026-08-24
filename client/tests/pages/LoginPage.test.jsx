import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "@/app/login/page";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

const login = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ login }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LoginPage", () => {
  it("logs in and redirects home on success", async () => {
    login.mockResolvedValueOnce({ email: "ada@example.com" });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await act(() => user.click(screen.getByRole("button", { name: "Login" })));

    expect(login).toHaveBeenCalledWith("ada@example.com", "password123");
    expect(push).toHaveBeenCalledWith("/");
    expect(refresh).toHaveBeenCalled();
  });

  it("shows an error message and does not redirect on failure", async () => {
    login.mockRejectedValueOnce(new Error("Invalid email or password"));
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "wrongpass");
    await act(() => user.click(screen.getByRole("button", { name: "Login" })));

    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
