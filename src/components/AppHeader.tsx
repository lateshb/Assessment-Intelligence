"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { UserMenu } from "./user-menu";

export default function AppHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
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

  // Close mobile menu on route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isPublicRoute =
    pathname === "/" && !user
      ? true
      : pathname === "/how-to-use" || pathname === "/build-and-scale" || pathname === "/login";

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

        {/* Authenticated Navigation (Desktop) */}
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
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-1.5 rounded-lg text-[#26306A] hover:bg-[#E9ECF9]"
              aria-label="Toggle navigation menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        ) : (
          /* Public / Logged-out Navigation (Desktop) */
          <div className="flex items-center gap-3">
            <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-[#26306A]">
              <a
                href="#workflow"
                className="rounded-lg px-2.5 py-1.5 hover:bg-[#E9ECF9] transition-colors"
              >
                Workflow
              </a>
              <a
                href="#capabilities"
                className="rounded-lg px-2.5 py-1.5 hover:bg-[#E9ECF9] transition-colors"
              >
                Capabilities
              </a>
              <a
                href="#diagnosis"
                className="rounded-lg px-2.5 py-1.5 hover:bg-[#E9ECF9] transition-colors"
              >
                Output &amp; Diagnosis
              </a>
              <a
                href="#trust"
                className="rounded-lg px-2.5 py-1.5 hover:bg-[#E9ECF9] transition-colors"
              >
                Trust &amp; Ethics
              </a>
              <Link
                href="/how-to-use"
                className="rounded-lg px-2.5 py-1.5 hover:bg-[#E9ECF9] transition-colors"
              >
                User Guide
              </Link>
            </nav>

            {/* Public Action Buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-xl border border-[#D5DAEC] bg-white px-3.5 py-1.5 text-xs font-bold text-[#141834] hover:bg-[#F4F6FC] transition-all"
                id="header-sign-in-btn"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="rounded-xl bg-[#26306A] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#3A4A9F] transition-all"
                id="header-try-demo-btn"
              >
                ⚡ Try Demo
              </Link>
            </div>

            {/* Mobile hamburger button for public visitor */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex h-11 w-11 items-center justify-center rounded-xl text-[#26306A] hover:bg-[#E9ECF9] focus:outline-hidden focus:ring-2 focus:ring-[#26306A] transition-colors cursor-pointer touch-manipulation"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              id="mobile-menu-toggle-btn"
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
        )}
      </div>

      {/* Mobile Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="border-t border-[#D5DAEC] bg-white px-5 py-5 shadow-2xl lg:hidden animate-in fade-in slide-in-from-top-2 duration-150" id="mobile-menu-drawer">
          {user ? (
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
          ) : (
            <div className="space-y-4">
              <nav className="flex flex-col gap-1 text-sm font-semibold text-[#26306A]">
                <a
                  href="#workflow"
                  className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 hover:bg-[#E9ECF9] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-xs font-bold text-[#3A4A9F]">01</span>
                  <span>Workflow</span>
                </a>
                <a
                  href="#capabilities"
                  className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 hover:bg-[#E9ECF9] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-xs font-bold text-[#3A4A9F]">02</span>
                  <span>Capabilities</span>
                </a>
                <a
                  href="#diagnosis"
                  className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 hover:bg-[#E9ECF9] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-xs font-bold text-[#3A4A9F]">03</span>
                  <span>Diagnostic Output</span>
                </a>
                <a
                  href="#trust"
                  className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 hover:bg-[#E9ECF9] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-xs font-bold text-[#3A4A9F]">04</span>
                  <span>Trust &amp; Ethics</span>
                </a>
                <Link
                  href="/how-to-use"
                  className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 hover:bg-[#E9ECF9] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-xs font-bold text-[#3A4A9F]">05</span>
                  <span>User Guide</span>
                </Link>
                <Link
                  href="/build-and-scale"
                  className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 hover:bg-[#E9ECF9] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-xs font-bold text-[#3A4A9F]">06</span>
                  <span>Build &amp; Scale Architecture</span>
                </Link>
              </nav>

              <div className="flex flex-col gap-2.5 pt-3 border-t border-[#EDEFF6]">
                <Link
                  href="/login"
                  className="w-full text-center rounded-xl bg-[#26306A] py-3 text-sm font-bold text-white shadow-md hover:bg-[#3A4A9F] transition-all cursor-pointer touch-manipulation"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ⚡ Try the Demo (50 Responses)
                </Link>
                <Link
                  href="/login"
                  className="w-full text-center rounded-xl border border-[#D5DAEC] bg-white py-2.5 text-sm font-bold text-[#141834] hover:bg-[#F4F6FC] transition-all cursor-pointer touch-manipulation"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In with Google
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
