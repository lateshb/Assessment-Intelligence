/**
 * Rubric Library persistence layer — Supabase integration.
 *
 * Provides database operations for rubric library stored in Supabase.
 */

import { createClient } from "@/lib/supabase/client";
import type { LibraryRubric } from "./rubric-library-types";

/**
 * Fetch all rubrics for the current user from Supabase.
 */
export async function fetchUserRubrics(): Promise<LibraryRubric[]> {
  const supabase = createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return [];

  const { data, error } = await supabase
    .from("rubric_library")
    .select("*")
    .eq("owner_id", user.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch rubrics:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    course: row.course,
    description: row.description || "",
    criteria: row.criteria,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Create a new rubric in Supabase.
 */
export async function createRubric(
  rubric: Omit<LibraryRubric, "id" | "createdAt" | "updatedAt">
): Promise<LibraryRubric | null> {
  const supabase = createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  // Get institution_id from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("institution_id")
    .eq("id", user.user.id)
    .single();

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
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create rubric:", error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    course: data.course,
    description: data.description || "",
    criteria: data.criteria,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Update an existing rubric in Supabase.
 */
export async function updateRubric(
  id: string,
  updates: Partial<Pick<LibraryRubric, "name" | "course" | "description" | "criteria">>
): Promise<LibraryRubric | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("rubric_library")
    .update({
      name: updates.name,
      course: updates.course,
      description: updates.description,
      criteria: updates.criteria,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Failed to update rubric:", error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    course: data.course,
    description: data.description || "",
    criteria: data.criteria,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Delete a rubric from Supabase.
 */
export async function deleteRubric(id: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase.from("rubric_library").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete rubric:", error);
    return false;
  }

  return true;
}

/**
 * Duplicate a rubric in Supabase.
 */
export async function duplicateRubric(id: string): Promise<LibraryRubric | null> {
  const supabase = createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  // Fetch the source rubric
  const { data: source, error: fetchError } = await supabase
    .from("rubric_library")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !source) {
    console.error("Failed to fetch source rubric:", fetchError);
    return null;
  }

  // Get institution_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("institution_id")
    .eq("id", user.user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  // Create the duplicate
  const { data, error } = await supabase
    .from("rubric_library")
    .insert({
      owner_id: user.user.id,
      institution_id: profile.institution_id,
      name: `${source.name} (copy)`,
      course: source.course,
      description: source.description,
      criteria: source.criteria,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to duplicate rubric:", error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    course: data.course,
    description: data.description || "",
    criteria: data.criteria,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
