/**
 * Rubric Library state management — Supabase-backed.
 *
 * Loads rubrics from Supabase on mount, dispatches async mutations.
 * Context API stays identical so consumers don't change.
 */

"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { LibraryRubric, RubricLibraryAction } from "./rubric-library-types";
import { createClient } from "@/lib/supabase/client";
import type { Rubric } from "./types";

// ─── Validation ────────────────────────────────────────────────────────────

export function validateLibraryRubric(
  rubric: { name: string; course: string; criteria: { name: string; maxMarks: number }[] }
): string | null {
  if (!rubric.name.trim()) return "Rubric name is required.";
  if (!rubric.course.trim()) return "Course is required.";
  if (rubric.criteria.length < 2) return "At least 2 criteria are required.";
  if (rubric.criteria.length > 5) return "Maximum 5 criteria allowed.";
  if (rubric.criteria.some((c) => !c.name.trim())) return "Every criterion needs a name.";
  if (rubric.criteria.some((c) => c.maxMarks < 1)) return "Every criterion needs at least 1 mark.";
  return null;
}

// ─── DB → LibraryRubric mapper ─────────────────────────────────────────────

function toLibraryRubric(row: Record<string, unknown>): LibraryRubric {
  return {
    id: row.id as string,
    name: row.name as string,
    course: row.course as string,
    description: (row.description as string) || "",
    criteria: row.criteria as Rubric[],
    visibility: (row.visibility as 'private' | 'institution') || 'private',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ─── Context type ──────────────────────────────────────────────────────────

type RubricLibraryContextType = {
  rubrics: LibraryRubric[];
  institutionRubrics: LibraryRubric[];
  loading: boolean;
  error: string | null;
  dispatch: (action: RubricLibraryAction) => void;
  reload: () => Promise<void>;
};

const RubricLibraryContext = createContext<RubricLibraryContextType | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────

export function RubricLibraryProvider({ children }: { children: ReactNode }) {
  const [rubrics, setRubrics] = useState<LibraryRubric[]>([]);
  const [institutionRubrics, setInstitutionRubrics] = useState<LibraryRubric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load rubrics from Supabase
  const reload = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setRubrics([]);
      setInstitutionRubrics([]);
      setLoading(false);
      return;
    }

    // Get profile for institution_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("institution_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      setLoading(false);
      return;
    }

    // My rubrics (owned by me)
    const { data: myData, error: myError } = await supabase
      .from("rubric_library")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (myError) {
      setError(myError.message);
      setLoading(false);
      return;
    }

    // Institution rubrics (same institution, not mine, visibility=institution)
    const { data: instData } = await supabase
      .from("rubric_library")
      .select("*")
      .eq("institution_id", profile.institution_id)
      .eq("visibility", "institution")
      .neq("owner_id", user.id)
      .order("created_at", { ascending: false });

    setRubrics((myData || []).map(toLibraryRubric));
    setInstitutionRubrics((instData || []).map(toLibraryRubric));
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Async dispatch that persists to Supabase then updates local state
  const dispatch = useCallback(
    async (action: RubricLibraryAction) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      switch (action.type) {
        case "CREATE_RUBRIC": {
          const { data: profile } = await supabase
            .from("profiles")
            .select("institution_id")
            .eq("id", user.id)
            .single();
          if (!profile) return;

          const { data, error: createError } = await supabase
            .from("rubric_library")
            .insert({
              owner_id: user.id,
              institution_id: profile.institution_id,
              name: action.rubric.name,
              course: action.rubric.course,
              description: action.rubric.description || null,
              criteria: action.rubric.criteria,
              visibility: action.rubric.visibility || 'private',
            })
            .select()
            .single();

          if (createError) {
            setError(createError.message);
            return;
          }
          setRubrics((prev) => [toLibraryRubric(data), ...prev]);
          break;
        }

        case "UPDATE_RUBRIC": {
          const { data, error: updateError } = await supabase
            .from("rubric_library")
            .update({
              name: action.updates.name,
              course: action.updates.course,
              description: action.updates.description,
              criteria: action.updates.criteria,
              visibility: action.updates.visibility,
              updated_at: new Date().toISOString(),
            })
            .eq("id", action.id)
            .select()
            .single();

          if (updateError) {
            setError(updateError.message);
            return;
          }
          setRubrics((prev) =>
            prev.map((r) => (r.id === action.id ? toLibraryRubric(data) : r))
          );
          break;
        }

        case "DELETE_RUBRIC": {
          const { error: deleteError } = await supabase
            .from("rubric_library")
            .delete()
            .eq("id", action.id);

          if (deleteError) {
            setError(deleteError.message);
            return;
          }
          setRubrics((prev) => prev.filter((r) => r.id !== action.id));
          break;
        }

        case "DUPLICATE_RUBRIC": {
          const source = rubrics.find((r) => r.id === action.id)
            || institutionRubrics.find((r) => r.id === action.id);
          if (!source) return;

          const { data: profile } = await supabase
            .from("profiles")
            .select("institution_id")
            .eq("id", user.id)
            .single();
          if (!profile) return;

          const { data, error: dupError } = await supabase
            .from("rubric_library")
            .insert({
              owner_id: user.id,
              institution_id: profile.institution_id,
              name: `${source.name} (copy)`,
              course: source.course,
              description: source.description || null,
              criteria: source.criteria.map((c) => ({ ...c })),
              visibility: 'private', // duplicates default to private
            })
            .select()
            .single();

          if (dupError) {
            setError(dupError.message);
            return;
          }
          setRubrics((prev) => [toLibraryRubric(data), ...prev]);
          break;
        }
      }
    },
    [rubrics, institutionRubrics]
  );

  return (
    <RubricLibraryContext.Provider
      value={{ rubrics, institutionRubrics, loading, error, dispatch, reload }}
    >
      {children}
    </RubricLibraryContext.Provider>
  );
}

export function useRubricLibrary() {
  const ctx = useContext(RubricLibraryContext);
  if (!ctx) throw new Error("useRubricLibrary must be used within a RubricLibraryProvider");
  return ctx;
}

// Re-export the reducer for test compatibility
export { validateLibraryRubric as validateRubric };
