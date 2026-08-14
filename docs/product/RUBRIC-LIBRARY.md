# Rubric Library Design

## 1. Purpose

The Rubric Library provides reusable, institution-shared rubrics organized by Course. Teachers can build a library of rubrics that can be quickly applied to new assessment questions without redefining criteria each time.

## 2. Organization

**Flat structure by Course** (no Topic/Module hierarchy in V1).

```
Rubric Library
  ├── Economics
  │    ├── "Price Elasticity Assessment" (3 criteria)
  │    ├── "Market Structures Essay" (4 criteria)
  │    └── "GDP Analysis" (3 criteria)
  ├── Physics
  │    ├── "Newton's Laws Problem Set" (4 criteria)
  │    └── "Thermodynamics Conceptual" (3 criteria)
  └── Mathematics
       └── "Calculus Application" (5 criteria)
```

## 3. Rubric structure

Each library rubric contains:

| Field | Type | Required |
|---|---|---|
| Name | text | Yes |
| Course | text | Yes |
| Description | text | No |
| Criteria | array of {name, description, maxMarks} | Yes (2–5 items) |

## 4. Ownership and visibility

- A rubric in the library belongs to a teacher (`owner_id`)
- All teachers in the same institution can view and use all library rubrics
- Only the owner (or an admin) can edit or delete a library rubric
- Any teacher can create new rubrics in the library

## 5. Snapshot mechanism

When a teacher selects a library rubric for a question:

1. The rubric criteria are **copied** into the question as a snapshot
2. The snapshot includes: criteria names, descriptions, max marks
3. The snapshot is stored in `questions.rubric_snapshot` (JSONB)
4. The source is recorded in `questions.rubric_library_id` (for provenance)
5. The question's `rubric_source` is set to `'library'`

After the snapshot is taken:
- The library rubric can be freely edited
- The question's rubric snapshot is unaffected
- Historical analyses reference the snapshot, not the library

## 6. User flows

### 6.1 Applying a library rubric to a question

1. Teacher expands a question
2. Clicks "Use from Rubric Library" (or equivalent)
3. Modal/panel opens showing library rubrics, filterable by course
4. Teacher previews a rubric (sees criteria, marks)
5. Clicks "Use this rubric"
6. Criteria are copied into the question
7. Teacher can still edit the snapshot if needed (it becomes "modified from library")

### 6.2 Saving a question's rubric to the library

1. Teacher has defined a custom rubric on a question
2. Clicks "Save to Rubric Library" (action in question menu)
3. Prompted for: rubric name, course
4. Rubric is saved to the library as a new entry
5. The question is NOT automatically linked to the library entry

### 6.3 Browsing the library

- Route: `/rubric-library`
- List of rubrics grouped/filtered by course
- Each card shows: name, course, criteria count, total marks, owner, last updated
- Click to view/edit (if owner or admin)
- "Create new rubric" button

### 6.4 Editing a library rubric

- Only by owner or admin
- Changes to a library rubric do NOT affect any question snapshots
- Standard edit form for name, course, description, criteria

## 7. Search and filter

- Filter by course (dropdown)
- Search by rubric name (text)
- Sort by: name, course, date created, date updated

## 8. Validation

- Rubric name: required, non-empty
- Course: required, non-empty
- Criteria: 2–5 items
- Each criterion: name required, maxMarks ≥ 1
