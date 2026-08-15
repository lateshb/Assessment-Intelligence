import { createClient } from '@/lib/supabase/client'
import type { AssessmentState } from './assessment-types'
import type { Database } from '@/types/database.types'

type Assessment = Database['public']['Tables']['assessments']['Row']
type Question = Database['public']['Tables']['questions']['Row']
type Analysis = Database['public']['Tables']['analyses']['Row']

export async function saveAssessmentToDb(state: AssessmentState, userId: string, institutionId: string) {
  const supabase = createClient()

  // 1. Upsert assessment
  const { data: assessment, error: assessmentError } = await supabase
    .from('assessments')
    .upsert({
      id: state.id || undefined,
      owner_id: userId,
      institution_id: institutionId,
      name: state.name || null,
      status: 'draft',
      sharing: 'private',
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (assessmentError) throw assessmentError

  // 2. Save questions and collect their IDs
  const questionIds = await Promise.all(
    state.questions.map(async (q, position) => {
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .upsert({
          id: q.dbId || undefined,
          assessment_id: assessment.id,
          position,
          question_text: q.questionText,
          rubric_source: q.rubricSource || null,
          rubric_library_id: q.rubricLibraryId || null,
          rubric_snapshot: q.rubric,
          responses: q.responseTab === 'csv' ? q.csvRows : q.pasteText,
          has_current_analysis: q.analysis !== null,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (questionError) throw questionError

      // 3. Save analysis if present
      if (q.analysis) {
        const { error: analysisError } = await supabase
          .from('analyses')
          .insert({
            question_id: question.id,
            is_current: true,
            question_text_snapshot: q.questionText,
            rubric_snapshot: q.rubric,
            responses_snapshot: q.responseTab === 'csv' ? q.csvRows : q.pasteText,
            per_response: q.analysis.perResponse,
            clusters: q.analysis.clusters,
            gap_map: q.analysis.gapMap,
            recommendation: q.analysis.recommendation,
            model: q.analysis.meta.model,
            latency_ms: q.analysis.meta.latencyMs || null,
            source: q.analysis.meta.source,
          })

        if (analysisError) throw analysisError
      }

      return question.id
    })
  )

  return {
    ...assessment,
    questionIds, // Return question IDs so caller can update state
  }
}

export async function loadAssessmentsFromDb(userId: string): Promise<Assessment[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('owner_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function loadAssessmentWithQuestionsFromDb(assessmentId: string): Promise<any> {
  const supabase = createClient()

  // Load assessment
  const { data: assessment, error: assessmentError } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', assessmentId)
    .single()

  if (assessmentError) throw assessmentError

  // Load questions
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('*')
    .eq('assessment_id', assessmentId)
    .order('position', { ascending: true })

  if (questionsError) throw questionsError

  // Load analyses for each question
  const questionsWithAnalyses = await Promise.all(
    questions.map(async (q) => {
      const { data: analyses } = await supabase
        .from('analyses')
        .select('*')
        .eq('question_id', q.id)
        .eq('is_current', true)
        .order('created_at', { ascending: false })
        .limit(1)

      return {
        ...q,
        analysis: analyses?.[0] || null,
      }
    })
  )

  return {
    ...assessment,
    questions: questionsWithAnalyses,
  }
}

export async function deleteAssessmentFromDb(assessmentId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('assessments')
    .delete()
    .eq('id', assessmentId)

  if (error) throw error
}
