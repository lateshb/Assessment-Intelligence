-- Initial schema for Assessment Intelligence
-- Creates institutions, profiles, assessments, questions, analyses, rubric_library, teacher_decisions
-- Implements Row Level Security policies per docs/product/SECURITY.md

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. INSTITUTIONS
-- ============================================================================

CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create default institution for V1
INSERT INTO institutions (id, name) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Default Institution');

-- ============================================================================
-- 2. PROFILES
-- ============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institutions(id),
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'admin')) DEFAULT 'teacher',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, institution_id, email, role)
  VALUES (
    NEW.id,
    '00000000-0000-0000-0000-000000000001',
    NEW.email,
    'teacher'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 3. ASSESSMENTS
-- ============================================================================

CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institutions(id),
  name TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'partial', 'complete', 'archived')) DEFAULT 'draft',
  sharing TEXT NOT NULL CHECK (sharing IN ('private', 'institution', 'teachers')) DEFAULT 'private',
  shared_with UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assessments_owner ON assessments(owner_id);
CREATE INDEX idx_assessments_institution ON assessments(institution_id);

-- ============================================================================
-- 4. QUESTIONS
-- ============================================================================

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  rubric_source TEXT CHECK (rubric_source IN ('custom', 'library')),
  rubric_library_id UUID,
  rubric_snapshot JSONB,
  responses JSONB DEFAULT '[]'::JSONB,
  has_current_analysis BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questions_assessment ON questions(assessment_id, position);

-- ============================================================================
-- 5. ANALYSES
-- ============================================================================

CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  question_text_snapshot TEXT NOT NULL,
  rubric_snapshot JSONB NOT NULL,
  responses_snapshot JSONB NOT NULL,
  per_response JSONB NOT NULL,
  clusters JSONB NOT NULL,
  gap_map JSONB NOT NULL,
  recommendation JSONB NOT NULL,
  model TEXT NOT NULL,
  latency_ms INTEGER,
  source TEXT NOT NULL CHECK (source IN ('live', 'cached')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analyses_question ON analyses(question_id, is_current);

-- ============================================================================
-- 6. TEACHER_DECISIONS
-- ============================================================================

CREATE TABLE teacher_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL CHECK (action IN ('approve', 'modify', 'reject')),
  summary TEXT NOT NULL,
  reason TEXT,
  modified_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teacher_decisions_analysis ON teacher_decisions(analysis_id);

-- ============================================================================
-- 7. RUBRIC_LIBRARY
-- ============================================================================

CREATE TABLE rubric_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID NOT NULL REFERENCES institutions(id),
  owner_id UUID NOT NULL REFERENCES profiles(id),
  course TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rubric_library_institution ON rubric_library(institution_id, course);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubric_library ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can read their own profile and institution profiles
CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users read institution profiles"
  ON profiles FOR SELECT
  USING (institution_id = (SELECT institution_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- ASSESSMENTS: Owner full access + institution/teacher sharing
CREATE POLICY "Owner full access"
  ON assessments FOR ALL
  USING (owner_id = auth.uid());

CREATE POLICY "Institution read shared"
  ON assessments FOR SELECT
  USING (
    sharing = 'institution'
    AND institution_id = (SELECT institution_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Teacher-shared read"
  ON assessments FOR SELECT
  USING (
    sharing = 'teachers'
    AND auth.uid() = ANY(shared_with)
  );

-- QUESTIONS: Access through assessment ownership/sharing
CREATE POLICY "Question access via assessment"
  ON questions FOR ALL
  USING (
    assessment_id IN (
      SELECT id FROM assessments
      WHERE owner_id = auth.uid()
         OR (sharing = 'institution' AND institution_id = (SELECT institution_id FROM profiles WHERE id = auth.uid()))
         OR (sharing = 'teachers' AND auth.uid() = ANY(shared_with))
    )
  );

-- ANALYSES: Same pattern as questions
CREATE POLICY "Analysis access via assessment"
  ON analyses FOR ALL
  USING (
    question_id IN (
      SELECT q.id FROM questions q
      JOIN assessments a ON q.assessment_id = a.id
      WHERE a.owner_id = auth.uid()
         OR (a.sharing = 'institution' AND a.institution_id = (SELECT institution_id FROM profiles WHERE id = auth.uid()))
         OR (a.sharing = 'teachers' AND auth.uid() = ANY(a.shared_with))
    )
  );

-- TEACHER_DECISIONS: Only decision maker can access
CREATE POLICY "Decision owner access"
  ON teacher_decisions FOR ALL
  USING (teacher_id = auth.uid());

-- RUBRIC_LIBRARY: Institution members can read, owner can manage
CREATE POLICY "Institution read rubrics"
  ON rubric_library FOR SELECT
  USING (institution_id = (SELECT institution_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Owner manage rubrics"
  ON rubric_library FOR ALL
  USING (owner_id = auth.uid());

CREATE POLICY "Institution create rubrics"
  ON rubric_library FOR INSERT
  WITH CHECK (institution_id = (SELECT institution_id FROM profiles WHERE id = auth.uid()));
