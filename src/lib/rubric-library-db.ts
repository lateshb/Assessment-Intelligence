/**
 * Rubric Library persistence layer — Supabase integration.
 *
 * Provides database operations for rubric library stored in Supabase.
 */

import { createClient } from "@/lib/supabase/client";
import type { LibraryRubric, RubricVisibility } from "./rubric-library-types";

function toLibraryRubric(data: Record<string, unknown>): LibraryRubric {
  return {
    id: data.id as string,
    name: data.name as string,
    course: data.course as string,
    description: (data.description as string) || "",
    criteria: data.criteria as LibraryRubric["criteria"],
    visibility: (data.visibility as RubricVisibility) || "private",
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

export async function fetchUserRubrics(): Promise<LibraryRubric[]> {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return [];

  const { data, error } = await supabase
    .from("rubric_library")
    .select("*")
    .eq("owner_id", user.user.id)
    .order("created_at", { ascending: false });

  if (error) { console.error("Failed to fetch rubrics:", error); return []; }
  return (data || []).map(toLibraryRubric);
}

export async function createRubric(
  rubric: Omit<LibraryRubric, "id" | "createdAt" | "updatedAt">
): Promise<LibraryRubric | null> {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles").select("institution_id").eq("id", user.user.id).single();
  if (!profile) throw new Error("Profile not found");

  const { data, error } = await supabase
    .from("rubric_library")
    .insert({
      owner_id: user.user.id,
      institution_id: profile.institution_id,
      name: rubric.name,
      course: rubric.course,
      description: rubric.description || null,
      criteria: rubric.criteria,
      visibility: rubric.visibility || "private",
    })
    .select().single();

  if (error) { console.error("Failed to create rubric:", error); return null; }
  return toLibraryRubric(data);
}

export async function updateRubric(
  id: string,
  updates: Partial<Pick<LibraryRubric, "name" | "course" | "description" | "criteria" | "visibility">>
): Promise<LibraryRubric | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("rubric_library")
    .update({
      name: updates.name,
      course: updates.course,
      description: updates.description,
      criteria: updates.criteria,
      visibility: updates.visibility,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id).select().single();

  if (error) { console.error("Failed to update rubric:", error); return null; }
  return toLibraryRubric(data);
}

export async function deleteRubric(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("rubric_library").delete().eq("id", id);
  if (error) { console.error("Failed to delete rubric:", error); return false; }
  return true;
}

export async function duplicateRubric(id: string): Promise<LibraryRubric | null> {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data: source, error: fetchError } = await supabase
    .from("rubric_library").select("*").eq("id", id).single();
  if (fetchError || !source) { console.error("Failed to fetch source rubric:", fetchError); return null; }

  const { data: profile } = await supabase
    .from("profiles").select("institution_id").eq("id", user.user.id).single();
  if (!profile) throw new Error("Profile not found");

  const { data, error } = await supabase
    .from("rubric_library")
    .insert({
      owner_id: user.user.id,
      institution_id: profile.institution_id,
      name: `${source.name} (copy)`,
      course: source.course,
      description: source.description,
      criteria: source.criteria,
      visibility: "private", // duplicates always default to private
    })
    .select().single();

  if (error) { console.error("Failed to duplicate rubric:", error); return null; }
  return toLibraryRubric(data);
}
