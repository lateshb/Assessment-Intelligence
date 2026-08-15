// Database types generated from Supabase schema
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      institutions: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          institution_id: string
          email: string
          display_name: string | null
          role: 'teacher' | 'admin'
          created_at: string
        }
        Insert: {
          id: string
          institution_id: string
          email: string
          display_name?: string | null
          role?: 'teacher' | 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          email?: string
          display_name?: string | null
          role?: 'teacher' | 'admin'
          created_at?: string
        }
      }
      assessments: {
        Row: {
          id: string
          owner_id: string
          institution_id: string
          name: string | null
          status: 'draft' | 'partial' | 'complete' | 'archived'
          sharing: 'private' | 'institution' | 'teachers'
          shared_with: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          institution_id: string
          name?: string | null
          status?: 'draft' | 'partial' | 'complete' | 'archived'
          sharing?: 'private' | 'institution' | 'teachers'
          shared_with?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          institution_id?: string
          name?: string | null
          status?: 'draft' | 'partial' | 'complete' | 'archived'
          sharing?: 'private' | 'institution' | 'teachers'
          shared_with?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          assessment_id: string
          position: number
          question_text: string
          rubric_source: 'custom' | 'library' | null
          rubric_library_id: string | null
          rubric_snapshot: Json | null
          responses: Json
          has_current_analysis: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          assessment_id: string
          position: number
          question_text: string
          rubric_source?: 'custom' | 'library' | null
          rubric_library_id?: string | null
          rubric_snapshot?: Json | null
          responses?: Json
          has_current_analysis?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          assessment_id?: string
          position?: number
          question_text?: string
          rubric_source?: 'custom' | 'library' | null
          rubric_library_id?: string | null
          rubric_snapshot?: Json | null
          responses?: Json
          has_current_analysis?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      analyses: {
        Row: {
          id: string
          question_id: string
          is_current: boolean
          question_text_snapshot: string
          rubric_snapshot: Json
          responses_snapshot: Json
          per_response: Json
          clusters: Json
          gap_map: Json
          recommendation: Json
          model: string
          latency_ms: number | null
          source: 'live' | 'cached'
          created_at: string
        }
        Insert: {
          id?: string
          question_id: string
          is_current?: boolean
          question_text_snapshot: string
          rubric_snapshot: Json
          responses_snapshot: Json
          per_response: Json
          clusters: Json
          gap_map: Json
          recommendation: Json
          model: string
          latency_ms?: number | null
          source: 'live' | 'cached'
          created_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          is_current?: boolean
          question_text_snapshot?: string
          rubric_snapshot?: Json
          responses_snapshot?: Json
          per_response?: Json
          clusters?: Json
          gap_map?: Json
          recommendation?: Json
          model?: string
          latency_ms?: number | null
          source?: 'live' | 'cached'
          created_at?: string
        }
      }
      teacher_decisions: {
        Row: {
          id: string
          analysis_id: string
          teacher_id: string
          action: 'approve' | 'modify' | 'reject'
          summary: string
          reason: string | null
          modified_text: string | null
          created_at: string
        }
        Insert: {
          id?: string
          analysis_id: string
          teacher_id: string
          action: 'approve' | 'modify' | 'reject'
          summary: string
          reason?: string | null
          modified_text?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          analysis_id?: string
          teacher_id?: string
          action?: 'approve' | 'modify' | 'reject'
          summary?: string
          reason?: string | null
          modified_text?: string | null
          created_at?: string
        }
      }
      rubric_library: {
        Row: {
          id: string
          institution_id: string
          owner_id: string
          course: string
          name: string
          description: string | null
          criteria: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          owner_id: string
          course: string
          name: string
          description?: string | null
          criteria: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          owner_id?: string
          course?: string
          name?: string
          description?: string | null
          criteria?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_institution_id: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
