# Authentication & Multi-tenancy — Assessment Intelligence

## 1. Authentication approach

**Supabase Auth with Google sign-in** is the V1 authentication mechanism.

Rationale:
- Simplest secure approach for this project
- No password management needed
- Google accounts are universal in education
- Supabase Auth is free tier compatible
- Built-in session management, token refresh, and security

### 1.1 Sign-in flow

1. User lands on `/` → sees landing page with "Sign in with Google" button
2. Click → Supabase Auth redirects to Google OAuth
3. Google authenticates → redirects back to app
4. Supabase creates/finds user in `auth.users`
5. Database trigger creates a `profiles` row if first sign-in
6. App redirects to dashboard

### 1.2 Session management

- Supabase client handles JWT tokens automatically
- Tokens refresh transparently
- Protected routes check auth state on the server (middleware or layout)
- API routes validate the Supabase session

### 1.3 First-time user flow

On first sign-in:
1. Trigger creates a `profiles` row with role `'teacher'` (default)
2. User is assigned to a default institution (or asked to join one)
3. User lands on empty dashboard

## 2. Roles

| Role | Capabilities |
|---|---|
| **Teacher** | CRUD own assessments, analyze, make decisions, manage own Rubric Library entries, view institution-shared assessments (read-only unless shared for editing) |
| **Admin** | Everything a teacher can do + manage institution teachers, view all institution-shared assessments, manage institution-wide Rubric Library entries |

### 2.1 Role assignment

- Default role on signup: `teacher`
- Admin role: set manually in database or by existing admin
- No self-service role elevation

### 2.2 Admin scope

Admin capabilities are intentionally minimal for V1:
- View institution teacher list
- Promote/demote teacher ↔ admin
- View institution-shared assessments
- Manage institution-wide rubric library entries

NOT in V1:
- Overriding teacher decisions
- Deleting other teachers' private data
- Enterprise SSO
- Audit logging of admin actions

## 3. Multi-tenancy

### 3.1 Institution model

- Each user belongs to exactly one institution
- `institution_id` is a column on `profiles`, `assessments`, and `rubric_library`
- All RLS policies filter by institution where applicable

### 3.2 Data isolation

| Data type | Visibility |
|---|---|
| Private assessment | Owner only |
| Institution-shared assessment | All teachers in the same institution (read) |
| Teacher-shared assessment | Owner + specific shared teachers |
| Rubric Library entry | All teachers in the same institution |
| Teacher decisions | Owner of the analysis only |

### 3.3 First institution setup

For V1, institution setup is simplified:
- A default institution is created during initial deployment
- New users are assigned to it
- This avoids building an institution onboarding flow for V1

If multi-institution support is needed later, the schema already supports it.

## 4. OAuth configuration

### 4.1 Supabase project settings

- Google OAuth provider enabled in Supabase dashboard
- Redirect URLs configured:
  - `https://assessment-intelligence.vercel.app` (production)
  - `http://localhost:3000` (local development)

### 4.2 Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=<project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
GEMINI_API_KEY=<server-only>
```

- `NEXT_PUBLIC_` prefix means client-accessible (by design for Supabase client)
- `GEMINI_API_KEY` remains server-only
- No service role key in client code

## 5. Protected routes

| Route | Auth required | Role |
|---|---|---|
| `/` | No (landing) / Yes (dashboard when authenticated) | Any |
| `/login` | No | — |
| `/assessment/*` | Yes | Teacher or Admin |
| `/history` | Yes | Teacher or Admin |
| `/rubric-library` | Yes | Teacher or Admin |
| `/how-to-use` | No | — |
| `/build-and-scale` | No | — |
| `/api/analyze` | Yes (Supabase session) | Teacher or Admin |
