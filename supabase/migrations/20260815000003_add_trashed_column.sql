-- Add trashed column to assessments for soft-delete (History Trash support)
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS trashed BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for filtering active vs trashed
CREATE INDEX IF NOT EXISTS idx_assessments_trashed ON assessments(owner_id, trashed);
