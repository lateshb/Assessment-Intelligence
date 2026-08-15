-- Fix infinite recursion in RLS policies
-- Replace subqueries on profiles table with a SECURITY DEFINER function
-- that bypasses RLS when looking up the current user's institution_id

-- 1. Create helper function (runs with elevated perms, no RLS loop)
CREATE OR REPLACE FUNCTION public.get_my_institution_id()
RETURNS UUID AS $$
  SELECT institution_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 2. Drop all policies that caused the recursion
DROP POLICY IF EXISTS "Users read own profile" ON profiles;
DROP POLICY IF EXISTS "Users read institution profiles" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
DROP POLICY IF EXISTS "Owner full access" ON assessments;
DROP POLICY IF EXISTS "Institution read shared" ON assessments;
DROP POLICY IF EXISTS "Teacher-shared read" ON assessments;
DROP POLICY IF EXISTS "Question access via assessment" ON questions;
DROP POLICY IF EXISTS "Analysis access via assessment" ON analyses;
DROP POLICY IF EXISTS "Decision owner access" ON teacher_decisions;
DROP POLICY IF EXISTS "Institution read rubrics" ON rubric_library;
DROP POLICY IF EXISTS "Owner manage rubrics" ON rubric_library;
DROP POLICY IF EXISTS "Institution create rubrics" ON rubric_library;

-- 3. Re-create profiles policies (no recursion: own profile uses auth.uid() directly)
CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users read institution profiles"
  ON profiles FOR SELECT
  USING (institution_id = public.get_my_institution_id());

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- 4. Assessments
CREATE POLICY "Owner full access"
  ON assessments FOR ALL
  USING (owner_id = auth.uid());

CREATE POLICY "Institution read shared"
  ON assessments FOR SELECT
  USING (
    sharing = 'institution'
    AND institution_id = public.get_my_institution_id()
  );

CREATE POLICY "Teacher-shared read"
  ON assessments FOR SELECT
  USING (
    sharing = 'teachers'
    AND auth.uid() = ANY(shared_with)
  );

-- 5. Questions (owner path avoids subquery on profiles)
CREATE POLICY "Question access via assessment"
  ON questions FOR ALL
  USING (
    assessment_id IN (
      SELECT id FROM assessments
      WHERE owner_id = auth.uid()
         OR (sharing = 'institution' AND institution_id = public.get_my_institution_id())
         OR (sharing = 'teachers' AND auth.uid() = ANY(shared_with))
    )
  );

-- 6. Analyses
CREATE POLICY "Analysis access via assessment"
  ON analyses FOR ALL
  USING (
    question_id IN (
      SELECT q.id FROM questions q
      JOIN assessments a ON q.assessment_id = a.id
      WHERE a.owner_id = auth.uid()
         OR (a.sharing = 'institution' AND a.institution_id = public.get_my_institution_id())
         OR (a.sharing = 'teachers' AND auth.uid() = ANY(a.shared_with))
    )
  );

-- 7. Teacher decisions
CREATE POLICY "Decision owner access"
  ON teacher_decisions FOR ALL
  USING (teacher_id = auth.uid());

-- 8. Rubric library
CREATE POLICY "Institution read rubrics"
  ON rubric_library FOR SELECT
  USING (institution_id = public.get_my_institution_id());

CREATE POLICY "Owner manage rubrics"
  ON rubric_library FOR ALL
  USING (owner_id = auth.uid());

CREATE POLICY "Institution create rubrics"
  ON rubric_library FOR INSERT
  WITH CHECK (institution_id = public.get_my_institution_id());
