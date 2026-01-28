/**
 * Add Goal Correlation to Stories
 *
 * Adds related_goals field to track which sprint goals each story addresses.
 * This enables better traceability from goals → stories.
 */

-- Add related_goals column to stories table
ALTER TABLE stories
ADD COLUMN IF NOT EXISTS related_goals TEXT[] DEFAULT '{}';

-- Add comment explaining the field
COMMENT ON COLUMN stories.related_goals IS 'Array of sprint goals this story addresses (by index or text)';

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_stories_related_goals
ON stories USING GIN(related_goals);
