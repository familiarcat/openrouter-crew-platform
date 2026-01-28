-- Add estimated_completion column to stories table
-- This enables Riker's timeline management features

ALTER TABLE stories
ADD COLUMN IF NOT EXISTS estimated_completion DATE;

-- Add index for efficient timeline queries
CREATE INDEX IF NOT EXISTS idx_stories_estimated_completion
ON stories(estimated_completion)
WHERE estimated_completion IS NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN stories.estimated_completion IS 'Estimated completion date for the story, used by Commander Riker for timeline management';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Added estimated_completion column to stories table';
    RAISE NOTICE '⏱️  Riker''s timeline management features now fully supported';
END $$;
