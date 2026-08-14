import type { Metadata } from "next";
import Link from "next/link";
import { RubricLibraryProvider } from "@/lib/use-rubric-library";
import { HistoryProvider } from "@/lib/use-history";
import "./globals.css";

export const metadata: Metadata = {
  title: "Assessment Intelligence — Learning-Gap Engine",
  description:
    "Predicts the misconception behind each student response so faculty can decide targeted remediation faster and better. AI recommends. Teachers decide.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F4F6FC] text-[#1D2140] antialiased">
        <header className="sticky top-0 z-40 border-b border-[#D5DAEC] bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#26306A] text-lg font-bold text-[#F5A623]">
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
            <nav className="flex items-center gap-1 text-sm font-medium">
              <Link href="/" className="rounded-lg px-3 py-1.5 text-[#26306A] hover:bg-[#E9ECF9]">
                App
              </Link>
              <Link href="/how-to-use" className="rounded-lg px-3 py-1.5 text-[#26306A] hover:bg-[#E9ECF9]">
                How to use
              </Link>
              <Link href="/rubric-library" className="rounded-lg px-3 py-1.5 text-[#26306A] hover:bg-[#E9ECF9]">
                Rubric Library
              </Link>
              <Link href="/history" className="rounded-lg px-3 py-1.5 text-[#26306A] hover:bg-[#E9ECF9]">
                History
              </Link>
              <Link href="/build-and-scale" className="rounded-lg px-3 py-1.5 text-[#26306A] hover:bg-[#E9ECF9]">
                Build &amp; scale
              </Link>
            </nav>
          </div>
        </header>
        <HistoryProvider>
        <RubricLibraryProvider>
        {children}
        </RubricLibraryProvider>
        </HistoryProvider>
        <footer className="mt-12 border-t border-[#D5DAEC] bg-white">
          <div className="mx-auto max-w-6xl px-4 py-5 text-xs leading-relaxed text-[#565C82]">
            <p className="font-medium text-[#26306A]">
              AI-assisted analysis on this site is probabilistic and can be wrong. Every mark and
              intervention requires teacher approval. This prototype runs on synthetic data only.
            </p>
            <p className="mt-1">
              DTAI Capstone · IIM Lucknow · Prototype for the PhysicsWallah AI transformation
              strategy · Vibe-coded; all AI-generated code disclosed in the repository README.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
