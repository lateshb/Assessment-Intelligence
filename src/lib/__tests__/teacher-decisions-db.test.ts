import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveTeacherDecision, loadTeacherDecisions } from '../teacher-decisions-db'
import { createClient } from '@/lib/supabase/client'

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

describe('teacher-decisions-db', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    }
    vi.mocked(createClient).mockReturnValue(mockSupabase)
  })

  describe('saveTeacherDecision', () => {
    it('saves an approve decision', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'decision-1',
          analysis_id: 'analysis-1',
          teacher_id: 'teacher-1',
          action: 'approve',
          summary: 'Test summary',
          reason: null,
          modified_text: null,
          created_at: '2026-01-01T00:00:00Z',
        },
        error: null,
      })

      const result = await saveTeacherDecision(
        'analysis-1',
        'teacher-1',
        'approve',
        'Test summary'
      )

      expect(result).toBeTruthy()
      expect(result?.action).toBe('approve')
      expect(mockSupabase.from).toHaveBeenCalledWith('teacher_decisions')
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        analysis_id: 'analysis-1',
        teacher_id: 'teacher-1',
        action: 'approve',
        summary: 'Test summary',
        reason: null,
        modified_text: null,
      })
    })

    it('saves a modify decision with modified text', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'decision-2',
          action: 'modify',
          summary: 'Modified summary',
          modified_text: 'Modified intervention text',
          created_at: '2026-01-01T00:00:00Z',
        },
        error: null,
      })

      const result = await saveTeacherDecision(
        'analysis-1',
        'teacher-1',
        'modify',
        'Modified summary',
        'Teacher edited',
        'Modified intervention text'
      )

      expect(result?.action).toBe('modify')
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'modify',
          modified_text: 'Modified intervention text',
        })
      )
    })

    it('saves a reject decision with reason', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'decision-3',
          action: 'reject',
          summary: 'Rejected',
          reason: 'Not the real gap',
          created_at: '2026-01-01T00:00:00Z',
        },
        error: null,
      })

      const result = await saveTeacherDecision(
        'analysis-1',
        'teacher-1',
        'reject',
        'Rejected',
        'Not the real gap'
      )

      expect(result?.action).toBe('reject')
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'reject',
          reason: 'Not the real gap',
        })
      )
    })

    it('returns null on error', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const result = await saveTeacherDecision(
        'analysis-1',
        'teacher-1',
        'approve',
        'Test'
      )

      expect(result).toBeNull()
    })
  })

  describe('loadTeacherDecisions', () => {
    it('loads decisions for an analysis', async () => {
      mockSupabase.order.mockResolvedValue({
        data: [
          {
            id: 'decision-1',
            analysis_id: 'analysis-1',
            action: 'approve',
            summary: 'First decision',
            reason: null,
            created_at: '2026-01-01T00:00:00Z',
          },
          {
            id: 'decision-2',
            analysis_id: 'analysis-1',
            action: 'modify',
            summary: 'Second decision',
            reason: 'Changed approach',
            created_at: '2026-01-01T01:00:00Z',
          },
        ],
        error: null,
      })

      const decisions = await loadTeacherDecisions('analysis-1')

      expect(decisions).toHaveLength(2)
      expect(decisions[0].action).toBe('approve')
      expect(decisions[1].action).toBe('modify')
      expect(mockSupabase.eq).toHaveBeenCalledWith('analysis_id', 'analysis-1')
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: true })
    })

    it('returns empty array on error', async () => {
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const decisions = await loadTeacherDecisions('analysis-1')

      expect(decisions).toEqual([])
    })
  })
})
