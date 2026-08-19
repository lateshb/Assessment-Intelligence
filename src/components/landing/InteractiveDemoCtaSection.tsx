"use client";

import Link from "next/link";

interface InteractiveDemoCtaSectionProps {
  onLaunchDemoClick?: () => void;
}

export default function InteractiveDemoCtaSection({
  onLaunchDemoClick,
}: InteractiveDemoCtaSectionProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:py-16" id="demo-cta">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E2656] via-[#26306A] to-[#1E2656] p-8 sm:p-12 lg:p-16 text-white shadow-xl">
        {/* Glow effects */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#F5A623]/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-[#3A4A9F]/40 blur-3xl" />

        <div className="relative mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-white/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#F5A623] backdrop-blur-xs">
            Interactive Experience
          </span>
          <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl text-white tracking-tight">
            See Assessment Intelligence in action
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[#C3CAEC] sm:text-base">
            Explore a realistic assessment using the existing curated 50-response economics demo dataset.
            Observe the batched AI classification, deterministic gap mapping, and teacher decision loop firsthand.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              onClick={onLaunchDemoClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#F5A623] px-8 py-4 text-sm font-bold text-[#141834] shadow-lg hover:brightness-105 focus:outline-hidden focus:ring-2 focus:ring-[#F5A623] focus:ring-offset-2 focus:ring-offset-[#26306A] transition-all"
              id="landing-launch-demo-btn"
            >
              <span>⚡ Launch Demo</span>
              <span className="text-xs font-normal opacity-85">(Requires Google Sign-in)</span>
            </Link>

            <Link
              href="/how-to-use"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-semibold text-white hover:bg-white/20 transition-all"
            >
              <span>Read 3-Min Demo Guide</span>
              <span>→</span>
            </Link>
          </div>

          <p className="mt-6 text-xs text-[#AEB7E0]">
            Sign in with Google to enter your private teacher workspace and load the pre-configured demo batch in 1 click.
          </p>
        </div>
      </div>
    </section>
  );
}
