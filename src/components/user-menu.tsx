"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import type { User } from "@supabase/supabase-js";

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Handle closing menu with Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    },
    [isOpen]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setSignOutError(null);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setSignOutError(error.message || "Failed to sign out. Please try again.");
        setIsSigningOut(false);
        return;
      }
      setIsOpen(false);
      setIsSigningOut(false);
      router.push("/login");
      router.refresh();
    } catch (err: any) {
      setSignOutError(err?.message || "An unexpected error occurred during sign out.");
      setIsSigningOut(false);
    }
  };

  if (!user) {
    return null;
  }

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Teacher";

  const email = user.email || "";
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const initial = (displayName.charAt(0) || email.charAt(0) || "T").toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setSignOutError(null);
        }}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="User account menu"
        id="user-menu-btn"
        className="flex items-center gap-2 rounded-xl border border-transparent px-2.5 py-1.5 text-[#26306A] hover:border-[#D5DAEC] hover:bg-[#E9ECF9] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#26306A] focus-visible:ring-offset-2 transition-all"
      >
        {/* Avatar with image or initials fallback */}
        <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#26306A] text-xs font-bold text-[#F5A623] shadow-xs">
          {avatarUrl && !imageError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-full w-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <span>{initial}</span>
          )}
        </div>

        {/* Display Name on larger screens */}
        <span className="text-xs sm:text-sm font-semibold max-w-[120px] truncate hidden sm:inline text-[#141834]">
          {displayName}
        </span>

        {/* Chevron Icon */}
        <svg
          className={`h-4 w-4 text-[#565C82] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop for click outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div
            role="menu"
            aria-label="User account options"
            className="absolute right-0 top-full mt-2 w-72 z-50 rounded-2xl border border-[#D5DAEC] bg-white p-3 shadow-xl animation-fade-in"
          >
            {/* User Profile Header */}
            <div className="flex items-center gap-3 border-b border-[#EDEFF6] pb-3 px-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#26306A] text-sm font-bold text-[#F5A623] shadow-xs">
                {avatarUrl && !imageError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-full w-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <span>{initial}</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#141834] truncate">
                  {displayName}
                </p>
                <p
                  className="text-xs text-[#565C82] truncate"
                  title={email}
                >
                  {email}
                </p>
                <span className="inline-block mt-0.5 rounded bg-[#E6F7F5] px-1.5 py-0.5 text-[10px] font-bold text-[#0E7C71]">
                  Teacher Account
                </span>
              </div>
            </div>

            {/* Error Message Banner */}
            {signOutError && (
              <div className="my-2 rounded-lg bg-rose-50 border border-rose-200 p-2 text-xs text-rose-700">
                <p className="font-semibold">Sign out failed</p>
                <p className="mt-0.5 text-[11px]">{signOutError}</p>
              </div>
            )}

            {/* Menu Actions */}
            <div className="pt-2">
              <button
                role="menuitem"
                onClick={handleSignOut}
                disabled={isSigningOut}
                id="sign-out-btn"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                {isSigningOut ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin text-rose-700"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    <span>Signing out…</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4 text-rose-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Sign Out</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
