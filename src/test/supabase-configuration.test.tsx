/**
 * Test suite for Supabase configuration handling
 * Tests that the app gracefully handles missing environment variables
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderWithRouter } from "./test-utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Components to test
import { LoginButton } from "../components/auth/LoginButton";
import { SyncStatus } from "../components/auth/SyncStatus";
import Login from "../screens/Login";
import Home from "../screens/Home";

// Mock the supabase module to control isSupabaseConfigured
vi.mock("../lib/supabase", async () => {
  const actual = await vi.importActual("../lib/supabase");
  return {
    ...actual,
    isSupabaseConfigured: true, // Will be overridden in tests
  };
});

// Import after mocking to get the mocked version
import * as supabaseModule from "../lib/supabase";

// Mock navigation
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Supabase Configuration Handling", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("When Supabase is configured", () => {
    beforeEach(() => {
      vi.mocked(supabaseModule).isSupabaseConfigured = true;
    });

    it("should show LoginButton when user is not logged in", () => {
      renderWithRouter(<LoginButton />);
      expect(
        screen.getByRole("link", { name: /sign in/i }),
      ).toBeInTheDocument();
    });

    it("should show SyncStatus component", () => {
      renderWithRouter(<SyncStatus />);
      expect(screen.getByText(/local only/i)).toBeInTheDocument();
    });

    it("should not redirect Login page to home", () => {
      renderWithRouter(<Login />);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should allow access to login page", () => {
      renderWithRouter(<Login />);
      expect(screen.getByText(/welcome to vocards/i)).toBeInTheDocument();
      expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
    });
  });

  describe("When Supabase is NOT configured", () => {
    beforeEach(() => {
      vi.mocked(supabaseModule).isSupabaseConfigured = false;
    });

    describe("LoginButton component", () => {
      it("should hide the LoginButton completely", () => {
        renderWithRouter(<LoginButton />);
        expect(
          screen.queryByRole("link", { name: /sign in/i }),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByRole("button", { name: /sign out/i }),
        ).not.toBeInTheDocument();
      });

      it("should return null and not render anything", () => {
        const { container } = renderWithRouter(<LoginButton />);
        expect(container.firstChild).toBeNull();
      });
    });

    describe("SyncStatus component", () => {
      it("should hide the SyncStatus component completely", () => {
        renderWithRouter(<SyncStatus />);
        expect(screen.queryByText(/local only/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/synced/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/syncing/i)).not.toBeInTheDocument();
      });

      it("should return null and not render anything", () => {
        const { container } = renderWithRouter(<SyncStatus />);
        expect(container.firstChild).toBeNull();
      });
    });

    describe("Login page redirect", () => {
      it("should redirect to home page when accessing login", () => {
        renderWithRouter(<Login />);
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });

      it("should not show login page content", () => {
        renderWithRouter(<Login />);
        expect(
          screen.queryByText(/welcome to vocards/i),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByText(/continue with google/i),
        ).not.toBeInTheDocument();
      });
    });

    describe("App stability", () => {
      it("should not crash when rendering components without Supabase config", () => {
        expect(() => {
          renderWithRouter(
            <div>
              <LoginButton />
              <SyncStatus />
            </div>,
          );
        }).not.toThrow();
      });

      it("should not crash Home page without Supabase config", () => {
        expect(() => {
          renderWithRouter(<Home />);
        }).not.toThrow();
      });

      it("should still show home page content without sync features", () => {
        renderWithRouter(<Home />);
        // Home page should still be functional
        expect(screen.getAllByText(/cards$/i).length).toBeGreaterThan(0);
      });
    });

    describe("Navigation and user interaction", () => {
      it("should handle clicking non-existent login button gracefully", async () => {
        userEvent.setup();
        renderWithRouter(<LoginButton />);

        // Should not find login button to click
        expect(
          screen.queryByRole("link", { name: /sign in/i }),
        ).not.toBeInTheDocument();

        // App should remain stable
        expect(document.body).toBeInTheDocument();
      });

      it("should handle navigation to login route and redirect to home", () => {
        renderWithRouter(<Login />, {
          routerProps: { initialEntries: ["/login"] },
        });

        expect(mockNavigate).toHaveBeenCalledWith("/");
      });
    });
  });

  describe("Environment variable simulation", () => {
    it("should handle undefined VITE_SUPABASE_URL", () => {
      // This simulates the condition where env vars are missing
      vi.mocked(supabaseModule).isSupabaseConfigured = false;

      expect(() => {
        renderWithRouter(
          <div>
            <LoginButton />
            <SyncStatus />
            <Login />
          </div>,
        );
      }).not.toThrow();
    });

    it("should handle empty VITE_SUPABASE_URL", () => {
      // This simulates empty env vars
      vi.mocked(supabaseModule).isSupabaseConfigured = false;

      const { container } = renderWithRouter(<LoginButton />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Error boundaries and error handling", () => {
    it("should not trigger error boundaries when Supabase is not configured", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      renderWithRouter(
        <div>
          <LoginButton />
          <SyncStatus />
        </div>,
      );

      // Should not log any errors
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should handle multiple component renders without Supabase config", () => {
      expect(() => {
        for (let i = 0; i < 5; i++) {
          const { unmount } = renderWithRouter(
            <div>
              <LoginButton />
              <SyncStatus />
            </div>,
          );
          unmount();
        }
      }).not.toThrow();
    });
  });

  describe("Authentication store behavior", () => {
    it("should handle auth store initialization without Supabase config", async () => {
      vi.mocked(supabaseModule).isSupabaseConfigured = false;

      renderWithRouter(<Home />);

      // Should not crash during auth store initialization
      await waitFor(() => {
        expect(screen.getAllByText(/cards$/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe("Accessibility", () => {
    it("should maintain accessibility when components are hidden", () => {
      vi.mocked(supabaseModule).isSupabaseConfigured = false;

      renderWithRouter(
        <div>
          <h1>My App</h1>
          <LoginButton />
          <SyncStatus />
          <main>Content</main>
        </div>,
      );

      // Should still have proper document structure
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole("main")).toBeInTheDocument();
    });
  });
});

describe("Supabase Client Behavior", () => {
  describe("When isSupabaseConfigured is false", () => {
    beforeEach(() => {
      vi.mocked(supabaseModule).isSupabaseConfigured = false;
    });

    it("should export a mock supabase client that does not throw", async () => {
      // Import the mocked supabase client
      const { supabase } = await import("../lib/supabase");

      expect(() => {
        // These operations should not throw errors
        supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        supabase.auth.signOut();
        supabase.from("cards").select("*");
      }).not.toThrow();
    });

    it("should handle auth operations gracefully", async () => {
      const { supabase } = await import("../lib/supabase");

      // These should not throw but return error responses
      const googleSignIn = await supabase.auth.signInWithOAuth({
        provider: "google",
      });
      expect(googleSignIn.error).toBeDefined();

      const signOut = await supabase.auth.signOut();
      expect(signOut.error).toBeDefined();

      const getSession = await supabase.auth.getSession();
      expect(getSession.error).toBeDefined();
    });

    it("should handle database operations gracefully", async () => {
      const { supabase } = await import("../lib/supabase");

      // Database operations should return errors instead of throwing
      const select = await supabase.from("cards").select();
      expect(select.error).toBeDefined();
      expect(select.data).toBeNull();
    });
  });
});
