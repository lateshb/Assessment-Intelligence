import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginForm from "../login-form";

const mockSignInWithOAuth = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithOAuth: mockSignInWithOAuth,
    },
  }),
}));

describe("LoginForm component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Google Sign-in button", () => {
    mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null });
    render(<LoginForm />);

    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
  });

  it("initiates OAuth sign-in with dynamic redirectTo on click", async () => {
    mockSignInWithOAuth.mockResolvedValue({ data: { url: "https://accounts.google.com/o/oauth2/v2/auth" }, error: null });
    render(<LoginForm />);

    const button = screen.getByRole("button", { name: /continue with google/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: expect.stringContaining("/auth/callback"),
        },
      });
    });
  });

  it("displays error banner when sign in fails", async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: null,
      error: { message: "Google OAuth popup was closed by user" },
    });

    render(<LoginForm />);

    const button = screen.getByRole("button", { name: /continue with google/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Sign In Error")).toBeInTheDocument();
      expect(screen.getByText("Google OAuth popup was closed by user")).toBeInTheDocument();
    });
  });
});
