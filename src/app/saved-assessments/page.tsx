import type { Metadata } from "next";
import SavedAssessmentsPage from "@/components/SavedAssessmentsPage";

export const metadata: Metadata = {
  title: "Saved Assessments — Assessment Intelligence",
  description: "View and reopen your saved draft assessments.",
};

export default function SavedAssessmentsRoute() {
  return <SavedAssessmentsPage />;
}
