# Data Model — Assessment Intelligence

## 1. Overview

All persistent data lives in Supabase (PostgreSQL). Row Level Security (RLS) enforces access control. Frontend filtering is supplementary, never the security boundary.

## 2. Entity relationship

```
institutions
  └── profiles (teachers / admins)
       ├── assessments
       │    └── questions
       │         ├── question_rubric_snapshots
       │         ├── question_responses
       │         ├── analyses
       │         │    ├── analysis_per_response
       │         │    ├── analysis_clusters
       │         │    ├── analysis_gap_map
       │         │    └── analysis_recommendation
       │         └── teacher_decisions
       └── rubric_library
            └── rubric_criteria
```

## 3. Tables

### 3.1 `institutions`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text NOT NULL | |
| `created_at` | timestamptz | DEFAULT now() |

### 3.2 `profiles`

Extends Supabase Auth `auth.users`. Created via trigger on user signup.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | References `auth.users.id` |
| `institution_id` | uuid FK | References `institutions.id` |
| `email` | text NOT NULL | From auth |
| `display_name` | text | |
| `role` | text NOT NULL | `'teacher'` or `'admin'` |
| `created_at` | timestamptz | DEFAULT now() |

### 3.3 `assessments`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | DEFAULT gen_random_uuid() |
| `owner_id` | uuid FK NOT NULL | References `profiles.id` |
| `institution_id` | uuid FK NOT NULL | References `institutions.id` |
| `name` | text | Optional (nullable) |
| `status` | text NOT NULL | `'draft'`, `'partial'`, `'complete'`, `'archived'` |
| `sharing` | text NOT NULL | `'private'`, `'institution'`, `'teachers'` |
| `shared_with` | uuid[] | Array of profile IDs (when sharing = 'teachers') |
| `created_at` | timestamptz | DEFAULT now() |
| `updated_at` | timestamptz | DEFAULT now() |

### 3.4 `questions`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | DEFAULT gen_random_uuid() |
| `assessment_id` | uuid FK NOT NULL | References `assessments.id` ON DELETE CASCADE |
| `position` | integer NOT NULL | Order within assessment |
| `question_text` | text NOT NULL | |
| `rubric_source` | text | `'custom'` or `'library'`; nullable before rubric set |
| `rubric_library_id` | uuid FK | References `rubric_library.id` (source, not the snapshot) |
| `rubric_snapshot` | jsonb | The frozen rubric criteria used for analysis |
| `responses` | jsonb | Array of `{id, text}` |
| `has_current_analysis` | boolean | DEFAULT false |
| `created_at` | timestamptz | DEFAULT now() |
| `updated_at` | timestamptz | DEFAULT now() |

### 3.5 `analyses`

One row per analysis run on a question. Editing inputs creates a new analysis; old ones are preserved.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | DEFAULT gen_random_uuid() |
| `question_id` | uuid FK NOT NULL | References `questions.id` ON DELETE CASCADE |
| `is_current` | boolean NOT NULL | DEFAULT true; set false when inputs change |
| `question_text_snapshot` | text NOT NULL | Frozen question text at analysis time |
| `rubric_snapshot` | jsonb NOT NULL | Frozen rubric at analysis time |
| `responses_snapshot` | jsonb NOT NULL | Frozen responses at analysis time |
| `per_response` | jsonb NOT NULL | Array of PerResponse objects |
| `clusters` | jsonb NOT NULL | Array of Cluster objects |
| `gap_map` | jsonb NOT NULL | Array of GapRow objects |
| `recommendation` | jsonb NOT NULL | Recommendation object |
| `model` | text NOT NULL | Model ID used |
| `latency_ms` | integer | |
| `source` | text NOT NULL | `'live'` or `'cached'` |
| `created_at` | timestamptz | DEFAULT now() |

### 3.6 `teacher_decisions`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | DEFAULT gen_random_uuid() |
| `analysis_id` | uuid FK NOT NULL | References `analyses.id` ON DELETE CASCADE |
| `teacher_id` | uuid FK NOT NULL | References `profiles.id` |
| `action` | text NOT NULL | `'approve'`, `'modify'`, `'reject'` |
| `summary` | text NOT NULL | |
| `reason` | text | For reject: reason chip |
| `modified_text` | text | For modify: edited intervention text |
| `created_at` | timestamptz | DEFAULT now() |

### 3.7 `rubric_library`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | DEFAULT gen_random_uuid() |
| `institution_id` | uuid FK NOT NULL | References `institutions.id` |
| `owner_id` | uuid FK NOT NULL | References `profiles.id` |
| `course` | text NOT NULL | Course name for organization |
| `name` | text NOT NULL | Rubric name |
| `description` | text | |
| `criteria` | jsonb NOT NULL | Array of `{name, description, maxMarks}` |
| `created_at` | timestamptz | DEFAULT now() |
| `updated_at` | timestamptz | DEFAULT now() |

## 4. Key design decisions

1. **Rubric snapshot**: When a library rubric is applied to a question, the criteria are copied into `questions.rubric_snapshot` and `analyses.rubric_snapshot`. The library rubric can change freely without affecting historical analyses.

2. **Analysis immutability**: An analysis row is never mutated. When inputs change, `is_current` is set to false, and a new analysis is created when re-analyzed.

3. **Shared_with as uuid[]**: Simple array of profile IDs for V1. If the sharing model becomes complex, this can be normalized into a junction table later.

4. **Responses as JSONB**: Student responses are stored as a JSONB array rather than a separate table because they are always read/written as a batch and the anonymous IDs have no independent lifecycle.

5. **Analyses store full snapshots**: Every analysis stores the complete inputs (question text, rubric, responses) that produced it. This ensures historical analyses are self-contained and reviewable.

## 5. Indexes (planned)

- `assessments(owner_id)` — teacher's own assessments
- `assessments(institution_id)` — institution-shared assessments
- `questions(assessment_id, position)` — ordered questions
- `analyses(question_id, is_current)` — current analysis lookup
- `rubric_library(institution_id, course)` — library browsing
- `teacher_decisions(analysis_id)` — decision lookup
