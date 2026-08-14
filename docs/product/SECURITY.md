# Security Architecture — Assessment Intelligence

## 1. Threat model (V1 scope)

| Threat | Mitigation |
|---|---|
| Unauthorized access to assessments | Supabase Auth + RLS |
| Teacher A reading Teacher B's private data | RLS policies enforce `owner_id` check |
| Client-side role spoofing | RLS checks `profiles.role` server-side |
| API key leakage | `GEMINI_API_KEY` server-only; `NEXT_PUBLIC_` only for Supabase anon key |
| SQL injection | Supabase client uses parameterized queries |
| XSS in student responses | React auto-escapes; no `dangerouslySetInnerHTML` |
| Service role credential exposure | Never in client code; only in server-side/migration contexts |

## 2. Row Level Security (RLS)

RLS is the **primary** access control mechanism. Frontend filtering supplements but does not replace it.

### 2.1 `profiles`

```sql
-- Users can read their own profile
CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Users can read profiles in their institution (for sharing)
CREATE POLICY "Users read institution profiles"
  ON profiles FOR SELECT
  USING (institution_id = (SELECT institution_id FROM profiles WHERE id = auth.uid()));

-- Users can update their own profile (display_name only)
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());
```

### 2.2 `assessments`

```sql
-- Owner can CRUD
CREATE POLICY "Owner full access"
  ON assessments FOR ALL
  USING (owner_id = auth.uid());

-- Institution members can read institution-shared assessments
CREATE POLICY "Institution read shared"
  ON assessments FOR SELECT
  USING (
    sharing = 'institution'
    AND institution_id = (SELECT institution_id FROM profiles WHERE id = auth.uid())
  );

-- Specific shared teachers can read
CREATE POLICY "Teacher-shared read"
  ON assessments FOR SELECT
  USING (
    sharing = 'teachers'
    AND auth.uid() = ANY(shared_with)
  );
```

### 2.3 `questions`

```sql
-- Access through assessment ownership / sharing
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
```

### 2.4 `analyses`

Same pattern as questions — access gated through assessment chain.

### 2.5 `teacher_decisions`

```sql
-- Only the decision maker can read/write their decisions
CREATE POLICY "Decision owner access"
  ON teacher_decisions FOR ALL
  USING (teacher_id = auth.uid());
```

### 2.6 `rubric_library`

```sql
-- All institution members can read
CREATE POLICY "Institution read rubrics"
  ON rubric_library FOR SELECT
  USING (institution_id = (SELECT institution_id FROM profiles WHERE id = auth.uid()));

-- Owner can update/delete
CREATE POLICY "Owner manage rubrics"
  ON rubric_library FOR ALL
  USING (owner_id = auth.uid());

-- Any institution member can insert
CREATE POLICY "Institution create rubrics"
  ON rubric_library FOR INSERT
  WITH CHECK (institution_id = (SELECT institution_id FROM profiles WHERE id = auth.uid()));
```

## 3. API security

### 3.1 `/api/analyze`

- Requires valid Supabase session (validated server-side)
- Rate limiting: Vercel's built-in; no custom rate limiting in V1
- Input validation: question non-empty, 2+ rubric criteria, 5+ responses
- Model API key never leaves server

### 3.2 Client-side Supabase

- Uses anon key (publishable, by design)
- All data access goes through RLS
- No service role key in client

## 4. Secret management

| Secret | Location | Exposed to client? |
|---|---|---|
| `GEMINI_API_KEY` | Vercel env var | No |
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel env var | Yes (by design) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel env var | Yes (by design) |
| Supabase service role key | Dashboard only | No |
| Google OAuth client secret | Supabase dashboard | No |

## 5. Data privacy

- Student responses use anonymous IDs only
- No names, emails, or PII in student data
- No demographic inputs
- Teacher data protected by auth + RLS
- Institution isolation enforced at database level
