/**
 * Transforms database records into AssessmentState for the UI.
 * 
 * Handles the mapping from Supabase row format to the local-first
 * assessment state model used by the reducer.
 */

import type { AssessmentState, QuestionState } from './assessment-types'
import type { Database } from '@/types/database.types'
import type { Rubric, StudentResponse, Analysis } from './types'
import { parsePasteText } from './use-assessment'

type DbAssessment = Database['public']['Tables']['assessments']['Row']
type DbQuestion = Database['public']['Tables']['questions']['Row']
type DbAnalysis = Database['public']['Tables']['analyses']['Row']

export function transformDbToAssessmentState(
  assessment: DbAssessment,
  questions: Array<DbQuestion & { analysis: DbAnalysis | null }>
): AssessmentState {
  const transformedQuestions: QuestionState[] = questions.map((dbQ) => {
    // Parse responses
    const responseData = dbQ.responses as any
    let pasteText = ''
    let csvRows: StudentResponse[] | null = null
    let responseTab: 'paste' | 'csv' = 'paste'

    if (Array.isArray(responseData)) {
      // CSV format (array of StudentResponse)
      csvRows = responseData as StudentResponse[]
      responseTab = 'csv'
    } else if (typeof responseData === 'string') {
      // Paste format (string)
      pasteText = responseData
      responseTab = 'paste'
    }

    // Parse rubric with null guard
    const rubric = (dbQ.rubric_snapshot as any) as Rubric[] || []

    // Parse analysis if present
    let analysis: Analysis | null = null
    if (dbQ.analysis) {
      const dbAnalysis = dbQ.analysis
      analysis = {
        id: dbAnalysis.id, // Include DB ID for decision persistence
        perResponse: dbAnalysis.per_response as any,
        clusters: dbAnalysis.clusters as any,
        gapMap: dbAnalysis.gap_map as any,
        recommendation: dbAnalysis.recommendation as any,
        meta: {
          model: dbAnalysis.model,
          latencyMs: dbAnalysis.latency_ms ?? 0,
          disclaimer: '',
          source: dbAnalysis.source as 'live' | 'cached',
        },
      }
    }

    // Compute analyzed input hash from analysis snapshots for accurate staleness detection
    let analyzedInputHash: string | null = null
    if (dbQ.analysis) {
      const snapResponses = dbQ.analysis.responses_snapshot as any
      const parsedResponses = Array.isArray(snapResponses)
        ? (snapResponses as StudentResponse[])
        : typeof snapResponses === 'string'
          ? parsePasteText(snapResponses)
          : []

      analyzedInputHash = JSON.stringify({
        questionText: dbQ.analysis.question_text_snapshot || '',
        rubric: (dbQ.analysis.rubric_snapshot as Rubric[]) || [],
        responses: parsedResponses.map((r) => r.text),
      })
    }

    // Compute status
    const status = computeQuestionStatus({
      questionText: dbQ.question_text,
      rubric,
      pasteText,
      csvRows,
      analysis,
      analyzedInputHash,
    })

    return {
      id: `q-db-${dbQ.id}`, // Unique local ID
      dbId: dbQ.id,
      rubricSource: dbQ.rubric_source as 'custom' | 'library' | null | undefined,
      rubricLibraryId: dbQ.rubric_library_id || null,
      questionText: dbQ.question_text,
      rubric,
      responseTab,
      pasteText,
      csvRows,
      csvName: csvRows ? `${csvRows.length} responses` : '',
      status,
      analysis,
      error: null,
      expanded: false,
      analyzedInputHash,
    }
  })

  return {
    id: assessment.id,
    name: assessment.name || '',
    questions: transformedQuestions,
    analyzeAllInProgress: false,
    demoFlag: false,
    saveInProgress: false,
    saveError: null,
  }
}

function computeInputHash(q: {
  questionText: string
  rubric: Rubric[]
  pasteText: string
  csvRows: StudentResponse[] | null
}): string {
  const responses = q.csvRows || parsePasteText(q.pasteText)
  return JSON.stringify({
    questionText: q.questionText,
    rubric: q.rubric,
    responses: responses.map((r: StudentResponse) => r.text),
  })
}

function computeQuestionStatus(q: {
  questionText: string
  rubric: Rubric[]
  pasteText: string
  csvRows: StudentResponse[] | null
  analysis: Analysis | null
  analyzedInputHash: string | null
}): QuestionState['status'] {
  const hasQuestion = q.questionText.trim().length > 0
  const hasRubric = q.rubric.some((r) => r.name.trim() !== '')
  const hasResponses =
    (q.csvRows && q.csvRows.length > 0) || q.pasteText.trim().length > 0

  if (!hasQuestion || !hasRubric || !hasResponses) {
    return 'draft'
  }

  if (q.analysis) {
    const currentHash = computeInputHash(q)
    if (q.analyzedInputHash && currentHash !== q.analyzedInputHash) {
      return 'needs_reanalysis'
    }
    return 'analyzed'
  }

  return 'ready'
}
