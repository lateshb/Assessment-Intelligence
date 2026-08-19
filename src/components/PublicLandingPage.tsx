"use client";

import HeroSection from "./landing/HeroSection";
import ProductVisualSection from "./landing/ProductVisualSection";
import WorkflowSection from "./landing/WorkflowSection";
import CapabilitiesSection from "./landing/CapabilitiesSection";
import DiagnosisOutputSection from "./landing/DiagnosisOutputSection";
import TrustSection from "./landing/TrustSection";
import DifferentiationSection from "./landing/DifferentiationSection";
import WhoItsForSection from "./landing/WhoItsForSection";
import InteractiveDemoCtaSection from "./landing/InteractiveDemoCtaSection";
import HowItWorksGuideSection from "./landing/HowItWorksGuideSection";
import FutureScaleSection from "./landing/FutureScaleSection";

export default function PublicLandingPage() {
  return (
    <main className="min-h-screen bg-[#F4F6FC] pb-16">
      {/* 1. SaaS Hero */}
      <HeroSection />

      {/* 2. Real Product Visual */}
      <ProductVisualSection />

      {/* 3. 6-Step Visual Workflow */}
      <WorkflowSection />

      {/* 4. Platform Capabilities (Everything the Teacher Can Do) */}
      <CapabilitiesSection />

      {/* 5. Core Value & Diagnostic Output */}
      <DiagnosisOutputSection />

      {/* 6. Explainability, Trust & Ethics */}
      <TrustSection />

      {/* 7. Why This Is Different */}
      <DifferentiationSection />

      {/* 8. Who It Is For */}
      <WhoItsForSection />

      {/* 9. Interactive Demo Launch CTA */}
      <InteractiveDemoCtaSection />

      {/* 10. Quick Start Guide */}
      <HowItWorksGuideSection />

      {/* 11. Built Today vs What Is Next */}
      <FutureScaleSection />
    </main>
  );
}
