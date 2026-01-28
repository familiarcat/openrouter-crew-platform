-- Add duration tracking fields to stories table
-- Enables multi-day story duration bars in timeline view

ALTER TABLE stories
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(5,2) DEFAULT 0 CHECK (estimated_hours >= 0);

-- Add index for timeline queries
CREATE INDEX IF NOT EXISTS idx_stories_start_date
ON stories(start_date)
WHERE start_date IS NOT NULL;

-- Add index for combined date range queries
CREATE INDEX IF NOT EXISTS idx_stories_date_range
ON stories(start_date, estimated_completion)
WHERE start_date IS NOT NULL AND estimated_completion IS NOT NULL;

-- Add comments
COMMENT ON COLUMN stories.start_date IS 'Date when work begins on the story, used for timeline duration bars';
COMMENT ON COLUMN stories.estimated_hours IS 'Estimated hours to complete the story, used by Riker for timeline planning';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Added start_date and estimated_hours columns to stories table';
    RAISE NOTICE '📊 Timeline duration bars now fully supported';
    RAISE NOTICE '⏱️  Stories can now span multiple days with stretch/contract functionality';
END $$;
