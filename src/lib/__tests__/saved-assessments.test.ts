import { describe, it, expect } from 'vitest'
import { transformDbToAssessmentState } from '../assessment-transformer'
import type { Database } from '@/types/database.types'

type DbAssessment = Database['public']['Tables']['assessments']['Row']
type DbQuestion = Database['public']['Tables']['questions']['Row']

describe('Assessment Transformer: DB → AssessmentState', () => {
  it('transforms simple assessment without analysis', () => {
    const dbAssessment: DbAssessment = {
      id: 'a1',
      name: 'Simple Assessment',
      status: 'draft',
      owner_id: 'user-1',
      institution_id: 'inst-1',
      sharing: 'private',
      shared_with: [],
      trashed: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    const dbQuestions = [
      {
        id: 'q1',
        assessment_id: 'a1',
        position: 0,
        question_text: 'What is AI?',
        rubric_snapshot: [
          { name: 'Understanding', description: 'Grasps concept', maxMarks: 5 },
          { name: 'Application', description: 'Applies concept', maxMarks: 5 },
        ],
        responses: 'Response 1\nResponse 2\nResponse 3',
        rubric_source: null,
        rubric_library_id: null,
        has_current_analysis: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        analysis: null,
      } as any,
    ]

    const state = transformDbToAssessmentState(dbAssessment, dbQuestions)

    expect(state.id).toBe('a1')
    expect(state.name).toBe('Simple Assessment')
    expect(state.questions).toHaveLength(1)
    expect(state.questions[0].questionText).toBe('What is AI?')
    expect(state.questions[0].dbId).toBe('q1')
    expect(state.questions[0].rubric).toHaveLength(2)
    expect(state.questions[0].responseTab).toBe('paste')
    expect(state.questions[0].pasteText).toBe('Response 1\nResponse 2\nResponse 3')
    expect(state.questions[0].analysis).toBeNull()
    expect(state.questions[0].status).toBe('ready')
  })

  it('preserves CSV responses when reopening', () => {
    const dbAssessment: DbAssessment = {
      id: 'a1',
      name: 'CSV Assessment',
      status: 'draft',
      owner_id: 'user-1',
      institution_id: 'inst-1',
      sharing: 'private',
      shared_with: [],
      trashed: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    const csvData = [
      { id: 'r1', text: 'Student response 1' },
      { id: 'r2', text: 'Student response 2' },
    ]

    const dbQuestions = [
      {
        id: 'q1',
        assessment_id: 'a1',
        position: 0,
        question_text: 'Explain elasticity',
        rubric_snapshot: [
          { name: 'Analysis', description: 'Deep understanding', maxMarks: 10 },
          { name: 'Expression', description: 'Clear writing', maxMarks: 10 },
        ],
        responses: csvData,
        rubric_source: null,
        rubric_library_id: null,
        has_current_analysis: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        analysis: null,
      } as any,
    ]

    const state = transformDbToAssessmentState(dbAssessment, dbQuestions)

    expect(state.questions[0].responseTab).toBe('csv')
    expect(state.questions[0].csvRows).toEqual(csvData)
    expect(state.questions[0].csvRows).toHaveLength(2)
  })

  it('restores analysis with complete metadata', () => {
    const dbAssessment: DbAssessment = {
      id: 'a1',
      name: 'Analyzed Assessment',
      status: 'draft',
      owner_id: 'user-1',
      institution_id: 'inst-1',
      sharing: 'private',
      shared_with: [],
      trashed: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    const dbQuestions = [
      {
        id: 'q1',
        assessment_id: 'a1',
        position: 0,
        question_text: 'What is elasticity?',
        rubric_snapshot: [
          { name: 'Understanding', description: 'Concept', maxMarks: 5 },
          { name: 'Application', description: 'Use', maxMarks: 5 },
        ],
        responses: 'R1\nR2',
        rubric_source: null,
        rubric_library_id: null,
        has_current_analysis: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        analysis: {
          id: 'an1',
          question_id: 'q1',
          is_current: true,
          question_text_snapshot: 'What is elasticity?',
          rubric_snapshot: [
            { name: 'Understanding', description: 'Concept', maxMarks: 5 },
            { name: 'Application', description: 'Use', maxMarks: 5 },
          ],
          responses_snapshot: 'R1\nR2',
          per_response: [
            { id: 'R1', category: 'correct', misconception: null, evidence: 'Good', confidence: 0.9, criterionScores: [5, 4], draftMark: 9 },
          ],
          clusters: [],
          gap_map: [
            { criterion: 'Understanding', masteryPct: 100, level: 'good' },
          ],
          recommendation: {
            type: 'Extension',
            durationMin: 10,
            targetDescription: 'Advanced students',
            targetIds: ['R1'],
            rationale: 'Ready for challenge',
            followUp: 'Advanced problems',
          },
          model: 'gemini-2.0-flash',
          latency_ms: 1500,
          source: 'live',
          created_at: '2024-01-01T00:00:00Z',
          disclaimer: 'Probabilistic',
        } as any,
      } as any,
    ]

    const state = transformDbToAssessmentState(dbAssessment, dbQuestions)

    expect(state.questions[0].analysis).not.toBeNull()
    expect(state.questions[0].analysis?.perResponse).toHaveLength(1)
    expect(state.questions[0].analysis?.perResponse[0].id).toBe('R1')
    expect(state.questions[0].analysis?.gapMap).toHaveLength(1)
    expect(state.questions[0].analysis?.meta.model).toBe('gemini-2.0-flash')
    expect(state.questions[0].analysis?.meta.latencyMs).toBe(1500)
    expect(state.questions[0].status).toBe('analyzed')
  })

  it('handles multiple questions in order', () => {
    const dbAssessment: DbAssessment = {
      id: 'a1',
      name: 'Multi-question',
      status: 'draft',
      owner_id: 'user-1',
      institution_id: 'inst-1',
      sharing: 'private',
      shared_with: [],
      trashed: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    const dbQuestions = [
      {
        id: 'q1',
        assessment_id: 'a1',
        position: 0,
        question_text: 'Q1: First',
        rubric_snapshot: [{ name: 'C1', description: 'D', maxMarks: 5 }],
        responses: 'R1',
        rubric_source: null,
        rubric_library_id: null,
        has_current_analysis: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        analysis: null,
      } as any,
      {
        id: 'q2',
        assessment_id: 'a1',
        position: 1,
        question_text: 'Q2: Second',
        rubric_snapshot: [{ name: 'C1', description: 'D', maxMarks: 5 }],
        responses: 'R2',
        rubric_source: null,
        rubric_library_id: null,
        has_current_analysis: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        analysis: null,
      } as any,
    ]

    const state = transformDbToAssessmentState(dbAssessment, dbQuestions)

    expect(state.questions).toHaveLength(2)
    expect(state.questions[0].questionText).toBe('Q1: First')
    expect(state.questions[1].questionText).toBe('Q2: Second')
  })

  it('correctly sets status to needs_reanalysis when question text is edited after analysis', () => {
    const dbAssessment: DbAssessment = {
      id: 'a1',
      name: 'Stale Test',
      status: 'draft',
      owner_id: 'user-1',
      institution_id: 'inst-1',
      sharing: 'private',
      shared_with: [],
      trashed: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    const dbQuestions = [
      {
        id: 'q1',
        assessment_id: 'a1',
        position: 0,
        question_text: 'What is deep learning? (EDITED)',
        rubric_snapshot: [{ name: 'C1', description: 'D', maxMarks: 5 }],
        responses: 'Response 1\nResponse 2\nResponse 3\nResponse 4\nResponse 5',
        rubric_source: null,
        rubric_library_id: null,
        has_current_analysis: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        analysis: {
          id: 'an1',
          question_id: 'q1',
          is_current: true,
          question_text_snapshot: 'What is neural network?', // Original text before edit
          rubric_snapshot: [{ name: 'C1', description: 'D', maxMarks: 5 }],
          responses_snapshot: 'Response 1\nResponse 2\nResponse 3\nResponse 4\nResponse 5',
          per_response: [],
          clusters: [],
          gap_map: [],
          recommendation: { type: 'Review', durationMin: 5, targetDescription: 'All', targetIds: [], rationale: '', followUp: '' },
          model: 'gemini-2.0-flash',
          latency_ms: 1000,
          source: 'live',
          created_at: '2024-01-01T00:00:00Z',
        } as any,
      } as any,
    ]

    const state = transformDbToAssessmentState(dbAssessment, dbQuestions)

    expect(state.questions[0].status).toBe('needs_reanalysis')
  })
})
