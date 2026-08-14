import type { Metadata } from "next";
import HistoryPage from "@/components/HistoryPage";

export const metadata: Metadata = {
  title: "Analysis History — Assessment Intelligence",
  description: "Review and revisit your past assessment analyses.",
};

export default function HistoryRoute() {
  return <HistoryPage />;
}
