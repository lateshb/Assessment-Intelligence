# UX Requirements — Assessment Intelligence

## 1. Design system (carried from prototype)

| Token | Value | Usage |
|---|---|---|
| Primary | `#26306A` (deep navy) | Headers, primary buttons, card borders |
| Accent | `#F5A623` (amber) | CTAs, kicker text, highlights |
| Background | `#F4F6FC` (light lavender) | Page canvas |
| Card background | `#FFFFFF` | All content cards |
| Border | `#D5DAEC` | Card/section borders |
| Subtle bg | `#EDEFF6` / `#F4F6FC` | Input backgrounds, chip backgrounds |
| Text primary | `#141834` / `#1D2140` | Headings, body |
| Text secondary | `#565C82` | Labels, captions |
| Correct | `#17B0A0` (teal) | Correct category |
| Warning | `#F5A623` / `#B45309` | Partial category, warning level |
| Error | `#E4572E` / `#B23A1B` | Misconception category, error state |
| Review | `#6C7396` | Needs review category |

Typography: system font stack (Apple, Segoe UI, Roboto). No custom font loading.

## 2. Layout patterns

- **Max width**: `max-w-6xl` (1152px) for main content
- **Cards**: `rounded-2xl border border-[#D5DAEC] bg-white p-5 shadow-sm`
- **Sticky header**: blurred white background, app logo + nav
- **Persistent footer**: AI disclaimer, prototype notice
- **Responsive**: works on phone (390px+), tested in prototype

## 3. Interaction patterns

### 3.1 Assessment workspace

The assessment workspace is the main application view when authenticated:

- **Assessment header**: name (editable, optional), status badge, save/share controls
- **Question list**: vertically stacked, collapsible/expandable
- **Each question card**: question text, rubric, responses input, action buttons
- **Analyze button**: per-question and "Analyze All" at assessment level
- **Results**: inline below each question (not a separate page/route)

### 3.2 Question card states

| State | Visual |
|---|---|
| Empty | Expanded, input fields visible |
| Filled (not analyzed) | Collapsible, shows question preview |
| Analyzed (current) | Shows results inline, green indicator |
| Analyzed (stale) | Warning banner: "Inputs changed since last analysis. Re-analyze to update." |

### 3.3 Question actions

Available via a "⋯" menu or action bar on each question:

- **Edit**: expand question to edit mode
- **Duplicate**: copy question (without analysis) as a new question in the assessment
- **Reset question**: clear all inputs and analysis (confirmation required)
- **Clear rubric**: remove rubric only (marks analysis stale; confirmation required)
- **Clear responses**: remove responses only (marks analysis stale; confirmation required)
- **Delete**: remove question from assessment (confirmation required; blocked if only one question)

### 3.4 Rubric Library interaction

- **Select from library**: modal/dropdown filtered by course
- **Preview before applying**: show criteria, marks, description
- **"Use this rubric"**: copies a snapshot into the question
- **Quick create**: save current question's rubric to library (pick a name + course)

### 3.5 Save and sharing

- **Save Draft**: explicit button, always visible in assessment header
- **Share**: dropdown with three options (private, institution, specific teachers)
- **Specific teachers**: email input with autocomplete against institution members

### 3.6 Analysis History

- **Assessment list**: card per assessment, showing name, date, question count, status
- **Drill down**: click assessment → see all questions with their analyses
- **Search/filter**: by name, date range, status

### 3.7 Loading and error states

- **Analyze loading**: full-width loading state with staged text (carried from prototype)
- **Analyze All loading**: per-question progress indicators
- **Error**: inline error banners, never crashes
- **Fallback**: cached demo analysis if model fails (carried from prototype)

### 3.8 Confirmation dialogs

Required for all destructive actions:
- Delete question
- Reset question
- Clear rubric (when analysis exists)
- Clear responses (when analysis exists)
- Delete assessment

Pattern: modal or inline confirmation with clear description of what will be lost.

## 4. Navigation structure (V2)

| Route | Purpose |
|---|---|
| `/` | Landing / dashboard (authenticated: assessment list) |
| `/login` | Google sign-in page |
| `/assessment/new` | New assessment workspace |
| `/assessment/[id]` | Existing assessment workspace |
| `/history` | Analysis History (assessment list) |
| `/rubric-library` | Rubric Library browser and editor |
| `/how-to-use` | User guide (carried from prototype) |
| `/build-and-scale` | Technical brief (carried from prototype) |

## 5. Accessibility requirements

- All interactive elements must have unique, descriptive IDs
- Focus states visible on all controls
- Proper heading hierarchy (one h1 per page)
- Semantic HTML5 elements
- WCAG AA color contrast (already met by design tokens)
