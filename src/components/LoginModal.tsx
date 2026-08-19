"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface LoginModalProps {
  onClose: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const supabase = createClient();

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      id="login-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl border border-[#D5DAEC] bg-white p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-[#565C82] hover:bg-[#EDEFF6] hover:text-[#141834] transition-colors cursor-pointer"
          aria-label="Close modal"
          id="login-modal-close-btn"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#26306A] text-xl font-bold text-[#F5A623] shadow-md">
            Ai
          </div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#EDEFF6] px-3 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#26306A]">
            Teacher Diagnostic Workspace
          </div>
          <h2 id="login-modal-title" className="text-2xl font-extrabold tracking-tight text-[#26306A]">
            Assessment Intelligence
          </h2>
          <p className="mx-auto mt-1.5 max-w-xs text-xs text-[#565C82]">
            Diagnose student misconceptions and turn assessment data into high-impact teaching actions.
          </p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <p className="font-bold">Sign In Error</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          id="modal-google-signin-btn"
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#D5DAEC] bg-white px-6 py-3.5 font-semibold text-[#141834] shadow-xs hover:border-[#3A4A9F] hover:bg-[#F4F6FC] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 transition-all touch-manipulation focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#26306A] cursor-pointer"
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

        <div className="mt-5 border-t border-[#EDEFF6] pt-4 text-center">
          <p className="text-xs leading-relaxed text-[#565C82]">
            Protected workspace for verified educators. Instant diagnostic rubric classification.
          </p>
        </div>
      </div>
    </div>
  );
}
