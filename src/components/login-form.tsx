"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Use dynamic origin to support localhost, local network IP, and production domains
      const origin =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : "https://assessment-intelligence.vercel.app";
      const redirectTo = `${origin}/auth/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (error) {
        setErrorMessage(error.message || "Failed to initialize Google Sign-in.");
        setIsLoading(false);
        return;
      }

      // Explicitly redirect to provider URL if returned
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || "An unexpected error occurred. Please try again."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center bg-[#F4F6FC] px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#26306A] text-2xl text-white shadow-md">
            🧠
          </div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#EDEFF6] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#26306A]">
            Teacher Diagnostic Workspace
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#26306A] sm:text-3xl">
            Assessment Intelligence
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-sm text-[#565C82]">
            Diagnose student misconceptions and turn assessment data into high-impact teaching actions.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#D5DAEC] bg-white p-6 sm:p-8 shadow-sm">
          {/* Error Banner if any */}
          {errorMessage && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <p className="font-bold">Sign In Error</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            id="google-signin-btn"
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#D5DAEC] bg-white px-6 py-3.5 font-semibold text-[#141834] shadow-xs hover:border-[#3A4A9F] hover:bg-[#F4F6FC] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 transition-all touch-manipulation focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#26306A]"
          >
            {isLoading ? (
              <>
                <svg
                  className="h-5 w-5 animate-spin text-[#26306A]"
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
                <span>Connecting to Google…</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <div className="mt-6 border-t border-[#EDEFF6] pt-4 text-center">
            <p className="text-xs leading-relaxed text-[#565C82]">
              Protected workspace for verified educators. Instant diagnostic rubric classification.
            </p>
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-8 flex items-center justify-center gap-4 text-center text-xs font-semibold text-[#3A4A9F]">
          <a href="/how-to-use" className="hover:underline">
            How to use
          </a>
          <span className="text-[#D5DAEC]">·</span>
          <a href="/build-and-scale" className="hover:underline">
            Architecture &amp; scale
          </a>
        </div>
      </div>
    </div>
  );
}
