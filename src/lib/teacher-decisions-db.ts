/**
 * Teacher Decisions persistence layer — Supabase integration.
 * 
 * Handles saving and loading teacher decisions (approve/modify/reject) 
 * for AI recommendations.
 */

import { createClient } from '@/lib/supabase/client'
import type { Decision } from './types'

export type TeacherDecisionRecord = {
  id: string
  analysis_id: string
  teacher_id: string
  action: 'approve' | 'modify' | 'reject'
  summary: string
  reason: string | null
  modified_text: string | null
  created_at: string
}

/**
 * Save a teacher decision to Supabase.
 * Returns the created decision record or null on error.
 */
export async function saveTeacherDecision(
  analysisId: string,
  teacherId: string,
  action: 'approve' | 'modify' | 'reject',
  summary: string,
  reason?: string,
  modifiedText?: string
): Promise<TeacherDecisionRecord | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('teacher_decisions')
    .insert({
      analysis_id: analysisId,
      teacher_id: teacherId,
      action,
      summary,
      reason: reason || null,
      modified_text: modifiedText || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to save teacher decision:', error)
    return null
  }

  return data as TeacherDecisionRecord
}

/**
 * Load all teacher decisions for a given analysis.
 * Returns decisions ordered by creation time (oldest first).
 */
export async function loadTeacherDecisions(analysisId: string): Promise<Decision[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('teacher_decisions')
    .select('*')
    .eq('analysis_id', analysisId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to load teacher decisions:', error)
    return []
  }

  return (data || []).map((d) => ({
    at: d.created_at,
    action: d.action as 'approve' | 'modify' | 'reject',
    summary: d.summary,
    reason: d.reason || undefined,
  }))
}
