"use client";

import { useLoginModal } from "@/lib/use-login-modal";

interface HeroSectionProps {
  onTryDemoClick?: () => void;
}

export default function HeroSection({ onTryDemoClick }: HeroSectionProps) {
  const { openLoginModal } = useLoginModal();

  return (
    <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24">
      {/* Background Subtle Gradient Accents */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-40">
        <div className="h-[450px] w-[650px] rounded-full bg-gradient-to-tr from-[#26306A]/15 via-[#3A4A9F]/10 to-[#F5A623]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 text-center">
        {/* Trust Principle Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#D5DAEC] bg-white px-3.5 py-1.5 shadow-xs transition-transform hover:scale-[1.02]">
          <span className="flex h-2 w-2 rounded-full bg-[#0E7C71]" />
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#26306A]">
            AI recommends. Teachers decide.
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-[#141834] sm:text-4xl md:text-5xl lg:text-6xl lg:leading-[1.15]">
          Turn student responses into{" "}
          <span className="bg-gradient-to-r from-[#26306A] via-[#3A4A9F] to-[#26306A] bg-clip-text text-transparent">
            better teaching decisions.
          </span>
        </h1>

        {/* Supporting Copy */}
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#565C82] sm:text-lg">
          Spot recurring misconceptions, map learning gaps across your class, and get actionable 15-minute lesson plans — with the teacher always in full control.
        </p>

        {/* Workflow Progression Pill */}
        <div className="mx-auto mt-6 inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-[#E9ECF9] px-3.5 py-2 text-xs font-semibold text-[#26306A]">
          <span className="text-[#3A4A9F]">1. Assess</span>
          <span className="text-[#98A2C8]">→</span>
          <span className="text-[#3A4A9F]">2. Diagnose</span>
          <span className="text-[#98A2C8]">→</span>
          <span className="text-[#3A4A9F]">3. Map Gaps</span>
          <span className="text-[#98A2C8]">→</span>
          <span className="text-[#3A4A9F]">4. Recommend</span>
          <span className="text-[#98A2C8]">→</span>
          <span className="text-[#0E7C71] font-bold">5. Teacher Decides</span>
        </div>

        {/* CTA */}
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={openLoginModal}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#26306A] px-8 py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#3A4A9F] focus:outline-hidden focus:ring-2 focus:ring-[#26306A] focus:ring-offset-2 transition-all cursor-pointer touch-manipulation"
            id="hero-sign-in-btn"
          >
            <span>Sign In with Google</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>

        {/* Micro Guarantee Statements */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-[#6C7396]">
          <span className="flex items-center gap-1.5">
            <span className="text-[#0E7C71] font-bold">✓</span> Always gives teachers final say
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-[#0E7C71] font-bold">✓</span> Quotes exact student text as proof
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-[#0E7C71] font-bold">✓</span> Shows AI confidence on every answer
          </span>
        </div>
      </div>
    </section>
  );
}
