import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { UserMenu } from "../user-menu";

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

let mockUser: any = null;
let mockSignOutError: any = null;
const mockSignOut = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({
          data: { user: mockUser },
          error: null,
        })
      ),
      onAuthStateChange: vi.fn((callback) => {
        // immediately notify callback with initial session
        callback("INITIAL_SESSION", mockUser ? { user: mockUser } : null);
        return {
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        };
      }),
      signOut: mockSignOut,
    },
  }),
}));

describe("UserMenu component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignOutError = null;
    mockSignOut.mockImplementation(() =>
      Promise.resolve({ error: mockSignOutError })
    );
  });

  it("renders null when there is no authenticated user", async () => {
    mockUser = null;
    const { container } = render(<UserMenu />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it("renders avatar and display name when user is authenticated", async () => {
    mockUser = {
      id: "user-123",
      email: "prof.oak@university.edu",
      user_metadata: {
        full_name: "Professor Oak",
      },
    };

    render(<UserMenu />);

    await waitFor(() => {
      expect(screen.getByText("Professor Oak")).toBeInTheDocument();
    });

    expect(screen.getByText("P")).toBeInTheDocument();
    expect(screen.getByLabelText("User account menu")).toBeInTheDocument();
  });

  it("falls back to email prefix when full_name is missing", async () => {
    mockUser = {
      id: "user-456",
      email: "jane.doe@school.org",
      user_metadata: {},
    };

    render(<UserMenu />);

    await waitFor(() => {
      expect(screen.getByText("jane.doe")).toBeInTheDocument();
    });
  });

  it("opens dropdown menu on click, displaying full details", async () => {
    mockUser = {
      id: "user-123",
      email: "prof.oak@university.edu",
      user_metadata: {
        full_name: "Professor Oak",
      },
    };

    render(<UserMenu />);

    await waitFor(() => {
      expect(screen.getByLabelText("User account menu")).toBeInTheDocument();
    });

    // Click to open menu
    fireEvent.click(screen.getByLabelText("User account menu"));

    expect(screen.getByText("Teacher Account")).toBeInTheDocument();
    expect(screen.getByText("prof.oak@university.edu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /sign out/i })).toBeInTheDocument();
  });

  it("closes dropdown menu when Escape key is pressed", async () => {
    mockUser = {
      id: "user-123",
      email: "prof.oak@university.edu",
      user_metadata: {
        full_name: "Professor Oak",
      },
    };

    render(<UserMenu />);

    await waitFor(() => {
      expect(screen.getByLabelText("User account menu")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("User account menu"));
    expect(screen.getByText("Teacher Account")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByText("Teacher Account")).not.toBeInTheDocument();
    });
  });

  it("handles sign out successfully and redirects to login", async () => {
    mockUser = {
      id: "user-123",
      email: "prof.oak@university.edu",
      user_metadata: {
        full_name: "Professor Oak",
      },
    };

    render(<UserMenu />);

    await waitFor(() => {
      expect(screen.getByLabelText("User account menu")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("User account menu"));

    const signOutBtn = screen.getByRole("menuitem", { name: /sign out/i });
    fireEvent.click(signOutBtn);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith("/login");
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it("displays user-facing error message when sign out fails", async () => {
    mockSignOutError = { message: "Network connection lost during logout" };
    mockUser = {
      id: "user-123",
      email: "prof.oak@university.edu",
      user_metadata: {
        full_name: "Professor Oak",
      },
    };

    render(<UserMenu />);

    await waitFor(() => {
      expect(screen.getByLabelText("User account menu")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("User account menu"));

    const signOutBtn = screen.getByRole("menuitem", { name: /sign out/i });
    fireEvent.click(signOutBtn);

    await waitFor(() => {
      expect(screen.getByText("Sign out failed")).toBeInTheDocument();
      expect(
        screen.getByText("Network connection lost during logout")
      ).toBeInTheDocument();
    });
  });
});
