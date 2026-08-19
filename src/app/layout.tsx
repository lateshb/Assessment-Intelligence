import type { Metadata } from "next";
import Link from "next/link";
import { AssessmentProvider } from "@/lib/AssessmentContext";
import { RubricLibraryProvider } from "@/lib/use-rubric-library";
import { HistoryProvider } from "@/lib/use-history";
import { LoginModalProvider } from "@/lib/use-login-modal";
import AppHeader from "@/components/AppHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Assessment Intelligence — Turn student responses into better teaching decisions",
  description:
    "Predicts the misconception behind each student response so faculty can decide targeted remediation faster and better. AI recommends. Teachers decide.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-[#F4F6FC] text-[#1D2140] antialiased">
        <LoginModalProvider>
          <AppHeader />

          <div className="flex-1">
            <AssessmentProvider>
              <HistoryProvider>
                <RubricLibraryProvider>
                  {children}
                </RubricLibraryProvider>
              </HistoryProvider>
            </AssessmentProvider>
          </div>
        </LoginModalProvider>

        <footer className="mt-16 border-t border-[#D5DAEC] bg-white">
          <div className="mx-auto max-w-6xl px-4 py-8">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {/* Brand Col */}
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#26306A] text-sm font-bold text-[#F5A623]">
                    Ai
                  </span>
                  <span className="text-sm font-bold text-[#141834]">
                    Assessment Intelligence
                  </span>
                </div>
                <p className="max-w-md text-xs leading-relaxed text-[#565C82]">
                  Diagnose student misconceptions from open-text answers in minutes.
                  AI proposes targeted interventions; teachers make every final decision.
                </p>
                <p className="text-[11px] font-semibold text-[#0E7C71]">
                  AI recommends. Teachers decide.
                </p>
              </div>

              {/* Workspace Navigation */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#141834]">
                  Workspace
                </p>
                <ul className="mt-3 space-y-2 text-xs">
                  <li>
                    <Link href="/" className="text-[#565C82] hover:text-[#26306A] hover:underline">
                      Workspace
                    </Link>
                  </li>
                  <li>
                    <Link href="/saved-assessments" className="text-[#565C82] hover:text-[#26306A] hover:underline">
                      Saved Assessments
                    </Link>
                  </li>
                  <li>
                    <Link href="/rubric-library" className="text-[#565C82] hover:text-[#26306A] hover:underline">
                      Global Rubrics
                    </Link>
                  </li>
                  <li>
                    <Link href="/history" className="text-[#565C82] hover:text-[#26306A] hover:underline">
                      Analysis History
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Documentation & System Briefs */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#141834]">
                  Documentation
                </p>
                <ul className="mt-3 space-y-2 text-xs">
                  <li>
                    <Link href="/how-to-use" className="text-[#3A4A9F] font-semibold hover:underline">
                      User Guide &amp; 3-Min Demo →
                    </Link>
                  </li>
                  <li>
                    <Link href="/build-and-scale" className="text-[#3A4A9F] font-semibold hover:underline">
                      Build &amp; Scale Technical Brief →
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom bar & Academic disclaimers */}
            <div className="mt-8 border-t border-[#EDEFF6] pt-5 text-xs text-[#6C7396] space-y-1.5">
              <p className="font-medium text-[#26306A]">
                AI-assisted analysis on this site is probabilistic and can be wrong. Every mark and intervention requires teacher approval. This prototype runs on synthetic data only.
              </p>
              <p className="text-[11px] text-[#8B92B5]">
                DTAI Capstone · IIM Lucknow · Prototype for the PhysicsWallah AI transformation strategy · Vibe-coded; all AI-generated code disclosed in the repository README.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
