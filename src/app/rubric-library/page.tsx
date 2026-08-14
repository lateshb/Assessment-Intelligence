import type { Metadata } from "next";
import RubricLibraryPage from "@/components/RubricLibraryPage";

export const metadata: Metadata = {
  title: "Rubric Library — Assessment Intelligence",
  description: "Create, manage, and reuse rubrics across assessment questions.",
};

export default function RubricLibraryRoute() {
  return <RubricLibraryPage />;
}
