"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLoginModal } from "@/lib/use-login-modal";
import type { User } from "@supabase/supabase-js";
import { UserMenu } from "./user-menu";

export default function AppHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { openLoginModal } = useLoginModal();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let mounted = true;

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (mounted) {
        setUser(user);
      }
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Close mobile menu on route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-[#D5DAEC] bg-white/95 backdrop-blur-xs">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:py-3">
        {/* Brand Logo & Tagline */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#26306A] text-lg font-bold text-[#F5A623] shadow-xs">
            Ai
          </span>
          <span>
            <span className="block text-sm font-bold leading-tight text-[#141834]">
              Assessment Intelligence
            </span>
            <span className="block text-[11px] leading-tight text-[#565C82]">
              AI recommends. Teachers decide.
            </span>
          </span>
        </Link>

        {/* Authenticated Navigation */}
        {user ? (
          <div className="flex items-center justify-end gap-1 text-xs sm:text-sm font-medium">
            <nav className="hidden sm:flex items-center gap-1 shrink-0">
              <Link
                href="/"
                className={`rounded-lg px-2.5 py-1.5 transition-colors whitespace-nowrap ${
                  pathname === "/"
                    ? "bg-[#E9ECF9] font-bold text-[#26306A]"
                    : "text-[#26306A] hover:bg-[#E9ECF9]"
                }`}
              >
                Workspace
              </Link>
              <Link
                href="/saved-assessments"
                className={`rounded-lg px-2.5 py-1.5 transition-colors whitespace-nowrap ${
                  pathname === "/saved-assessments"
                    ? "bg-[#E9ECF9] font-bold text-[#26306A]"
                    : "text-[#26306A] hover:bg-[#E9ECF9]"
                }`}
              >
                Saved Assessments
              </Link>
              <Link
                href="/rubric-library"
                className={`rounded-lg px-2.5 py-1.5 transition-colors whitespace-nowrap ${
                  pathname === "/rubric-library"
                    ? "bg-[#E9ECF9] font-bold text-[#26306A]"
                    : "text-[#26306A] hover:bg-[#E9ECF9]"
                }`}
              >
                Global Rubrics
              </Link>
              <Link
                href="/history"
                className={`rounded-lg px-2.5 py-1.5 transition-colors whitespace-nowrap ${
                  pathname === "/history"
                    ? "bg-[#E9ECF9] font-bold text-[#26306A]"
                    : "text-[#26306A] hover:bg-[#E9ECF9]"
                }`}
              >
                Analysis History
              </Link>
            </nav>
            <div className="ml-2 shrink-0">
              <UserMenu />
            </div>
            {/* Mobile menu button for logged-in user */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="sm:hidden flex h-10 w-10 items-center justify-center rounded-xl text-[#26306A] hover:bg-[#E9ECF9] focus:outline-hidden focus:ring-2 focus:ring-[#26306A] transition-colors cursor-pointer touch-manipulation"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        ) : (
          /* Public / Logged-out Header (Desktop & Mobile) */
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openLoginModal}
              className="rounded-xl bg-[#26306A] px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-[#3A4A9F] transition-all cursor-pointer touch-manipulation"
              id="header-sign-in-btn"
            >
              Sign In
            </button>
          </div>
        )}
      </div>

      {/* Mobile Drawer (Only for authenticated user) */}
      {user && mobileMenuOpen && (
        <div className="border-t border-[#D5DAEC] bg-white px-5 py-5 shadow-2xl transition-all sm:hidden" id="mobile-menu-drawer">
          <nav className="flex flex-col gap-1.5 text-sm font-semibold text-[#26306A]">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 hover:bg-[#E9ECF9] transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>📝 Workspace</span>
            </Link>
            <Link
              href="/saved-assessments"
              className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 hover:bg-[#E9ECF9] transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>💾 Saved Assessments</span>
            </Link>
            <Link
              href="/rubric-library"
              className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 hover:bg-[#E9ECF9] transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>📚 Global Rubrics</span>
            </Link>
            <Link
              href="/history"
              className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 hover:bg-[#E9ECF9] transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>⏳ Analysis History</span>
            </Link>
            <Link
              href="/how-to-use"
              className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 hover:bg-[#E9ECF9] transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>📖 User Guide</span>
            </Link>
            <Link
              href="/build-and-scale"
              className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 hover:bg-[#E9ECF9] transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>🚀 Build &amp; Scale</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
