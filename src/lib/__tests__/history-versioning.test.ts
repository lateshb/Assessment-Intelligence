import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveAssessmentToDb } from '../assessment-db'
import { createClient } from '@/lib/supabase/client'
import type { AssessmentState } from '../assessment-types'

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

describe('Re-analysis and History Versioning', () => {
  let updateCalls: any[]
  let insertCalls: any[]
  let eqCalls: any[]

  beforeEach(() => {
    updateCalls = []
    insertCalls = []
    eqCalls = []

    const mockSupabase = {
      from: vi.fn((table: string) => {
        const chain = {
          upsert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: table === 'assessments' 
                    ? { id: 'assessment-1', owner_id: 'user-1', institution_id: 'inst-1' }
                    : { id: 'question-1' },
                  error: null,
                })
              ),
            })),
          })),
          update: vi.fn((data: any) => {
            updateCalls.push({ table, data })
            return {
              eq: vi.fn((field: string, value: any) => {
                eqCalls.push({ table, field, value })
                return {
                  eq: vi.fn((field2: string, value2: any) => {
                    eqCalls.push({ table, field: field2, value: value2 })
                    return Promise.resolve({ data: null, error: null })
                  }),
                }
              }),
            }
          }),
          insert: vi.fn((data: any) => {
            insertCalls.push({ table, data })
            return {
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: 'analysis-new', is_current: true },
                    error: null,
                  })
                ),
              })),
            }
          }),
        }
        return chain
      }),
      auth: {
        getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'user-1' } }, error: null })),
      },
    }

    vi.mocked(createClient).mockReturnValue(mockSupabase as any)
  })

  it('marks old analyses as is_current=false before inserting new analysis', async () => {
    const state: AssessmentState = {
      id: 'assessment-1',
      name: 'Test Assessment',
      questions: [
        {
          id: 'q1',
          dbId: 'question-1',
          questionText: 'What is economics?',
          rubric: [{ name: 'Understanding', description: 'Concept grasp', maxMarks: 5 }],
          responseTab: 'paste',
          pasteText: 'Student response',
          csvRows: null,
          csvName: '',
          status: 'analyzed',
          analysis: {
            id: 'analysis-1',
            perResponse: [],
            clusters: [],
            gapMap: [],
            recommendation: { type: 'Review', durationMin: 10, targetDescription: 'All', targetIds: [], rationale: 'Test', followUp: 'Test' },
            meta: { model: 'gemini-2.0-flash-exp', latencyMs: 100, disclaimer: '', source: 'live' },
          },
          error: null,
          expanded: false,
          analyzedInputHash: 'hash1',
        },
      ],
      analyzeAllInProgress: false,
      demoFlag: false,
    }

    await saveAssessmentToDb(state, 'user-1', 'inst-1')

    // Verify UPDATE was called to mark old analyses as stale
    expect(updateCalls).toContainEqual({
      table: 'analyses',
      data: { is_current: false },
    })

    // Verify eq() was called with question_id and is_current
    expect(eqCalls).toContainEqual({
      table: 'analyses',
      field: 'question_id',
      value: 'question-1',
    })
    expect(eqCalls).toContainEqual({
      table: 'analyses',
      field: 'is_current',
      value: true,
    })
  })

  it('inserts new analysis with is_current=true after marking old ones stale', async () => {
    const state: AssessmentState = {
      id: 'assessment-1',
      name: 'Test',
      questions: [
        {
          id: 'q1',
          dbId: 'question-1',
          questionText: 'Test question',
          rubric: [{ name: 'C1', description: 'D1', maxMarks: 5 }],
          responseTab: 'paste',
          pasteText: 'Response',
          csvRows: null,
          csvName: '',
          status: 'analyzed',
          analysis: {
            perResponse: [],
            clusters: [],
            gapMap: [],
            recommendation: { type: 'Review', durationMin: 10, targetDescription: 'All', targetIds: [], rationale: 'Test', followUp: 'Test' },
            meta: { model: 'gemini-2.0-flash-exp', latencyMs: 100, disclaimer: '', source: 'live' },
          },
          error: null,
          expanded: false,
          analyzedInputHash: 'hash1',
        },
      ],
      analyzeAllInProgress: false,
      demoFlag: false,
    }

    await saveAssessmentToDb(state, 'user-1', 'inst-1')

    // Verify new analysis was inserted with is_current=true
    const analysisInsert = insertCalls.find(call => call.table === 'analyses')
    expect(analysisInsert).toBeDefined()
    expect(analysisInsert.data).toMatchObject({
      question_id: 'question-1',
      is_current: true,
    })
  })

  it('update happens before insert (preserves old analysis)', async () => {
    const state: AssessmentState = {
      id: 'assessment-1',
      name: 'Test',
      questions: [
        {
          id: 'q1',
          dbId: 'question-1',
          questionText: 'Updated question',
          rubric: [{ name: 'C1', description: 'D1', maxMarks: 5 }],
          responseTab: 'paste',
          pasteText: 'New response',
          csvRows: null,
          csvName: '',
          status: 'analyzed',
          analysis: {
            perResponse: [],
            clusters: [],
            gapMap: [],
            recommendation: { type: 'Review', durationMin: 15, targetDescription: 'Group A', targetIds: [], rationale: 'Updated', followUp: 'Follow-up' },
            meta: { model: 'gemini-2.0-flash-exp', latencyMs: 150, disclaimer: '', source: 'live' },
          },
          error: null,
          expanded: false,
          analyzedInputHash: 'hash2',
        },
      ],
      analyzeAllInProgress: false,
      demoFlag: false,
    }

    await saveAssessmentToDb(state, 'user-1', 'inst-1')

    // Verify UPDATE was called (not DELETE), preserving old analysis
    expect(updateCalls.length).toBeGreaterThan(0)
    expect(updateCalls).toContainEqual({
      table: 'analyses',
      data: { is_current: false },
    })

    // Verify new analysis was inserted
    const analysisInsert = insertCalls.find(call => call.table === 'analyses')
    expect(analysisInsert).toBeDefined()
  })
})
