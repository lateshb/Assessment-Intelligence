-- Fix SECURITY DEFINER search_path and rubric_library RLS policy

-- 1. Ensure handle_new_user has explicit search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, institution_id, email, display_name, role)
  VALUES (
    new.id,
    '00000000-0000-0000-0000-000000000001',
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    'teacher'
  );
  RETURN new;
END;
$$;

-- 2. Ensure get_my_institution_id has explicit search_path
CREATE OR REPLACE FUNCTION public.get_my_institution_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT institution_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 3. Update rubric_library SELECT policy to use get_my_institution_id() to avoid profiles subquery RLS recursion
-- Drop both overlapping policies from migrations 000002 and 000004
DROP POLICY IF EXISTS "Institution read rubrics" ON rubric_library;
DROP POLICY IF EXISTS "Users can view rubrics in their institution" ON rubric_library;
DROP POLICY IF EXISTS "Users can view own or institution rubrics" ON rubric_library;

CREATE POLICY "Users can view own or institution rubrics"
  ON rubric_library FOR SELECT
  USING (
    owner_id = auth.uid()
    OR (visibility = 'institution' AND institution_id = public.get_my_institution_id())
  );
