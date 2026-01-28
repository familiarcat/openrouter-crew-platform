-- Sprint System Database Schema
-- RAG Product Factory - Agile Sprint Management
-- Created: December 28, 2025
-- Based on: SPRINT_DATA_MODEL.md

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Sprint status enum
CREATE TYPE sprint_status AS ENUM (
    'planning',
    'active',
    'completed',
    'cancelled'
);

-- Story status enum
CREATE TYPE story_status AS ENUM (
    'backlog',
    'planned',
    'in_progress',
    'in_review',
    'completed',
    'blocked'
);

-- Story type enum (user story vs developer story)
CREATE TYPE story_type AS ENUM (
    'user_story',
    'developer_story',
    'technical_task',
    'bug_fix'
);

-- Persona type enum
CREATE TYPE persona_type AS ENUM (
    'user',
    'developer'
);

-- Task status enum
CREATE TYPE task_status AS ENUM (
    'todo',
    'in_progress',
    'completed',
    'blocked'
);

-- ============================================================================
-- PERSONAS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS personas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    type persona_type NOT NULL,
    description TEXT,

    -- Persona attributes
    technical_level INTEGER DEFAULT 5 CHECK (technical_level >= 1 AND technical_level <= 10),
    goals TEXT[] DEFAULT '{}',
    pain_points TEXT[] DEFAULT '{}',
    preferred_crew_member VARCHAR(50), -- Maps to crew_member enum from crew system

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_technical_level CHECK (technical_level >= 1 AND technical_level <= 10)
);

-- ============================================================================
-- SPRINTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS sprints (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id VARCHAR(255) NOT NULL, -- References projects in data/projects.json
    name VARCHAR(255) NOT NULL,
    sprint_number INTEGER,

    -- Sprint timeline
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    -- Sprint goals and metrics
    goals TEXT[] DEFAULT '{}',
    status sprint_status DEFAULT 'planning',
    velocity_target INTEGER DEFAULT 0, -- Story points planned
    velocity_actual INTEGER DEFAULT 0, -- Story points completed

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(255),

    -- Constraints
    CONSTRAINT valid_sprint_dates CHECK (end_date > start_date),
    CONSTRAINT valid_velocity CHECK (velocity_target >= 0 AND velocity_actual >= 0),
    CONSTRAINT unique_sprint_number_per_project UNIQUE (project_id, sprint_number)
);

-- ============================================================================
-- STORIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS stories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
    project_id VARCHAR(255) NOT NULL,

    -- Story content
    title VARCHAR(500) NOT NULL,
    description TEXT,
    story_type story_type DEFAULT 'user_story',
    status story_status DEFAULT 'backlog',

    -- Persona and crew assignment
    persona_id UUID REFERENCES personas(id) ON DELETE SET NULL,
    assigned_crew_member VARCHAR(50), -- Maps to crew_member enum

    -- Story points and priority
    story_points INTEGER DEFAULT 0 CHECK (story_points >= 0 AND story_points <= 100),
    priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5), -- 1=highest, 5=lowest

    -- Dependencies
    blocked_by UUID[] DEFAULT '{}', -- Array of story IDs
    blocks UUID[] DEFAULT '{}', -- Array of story IDs

    -- Tags and labels
    tags TEXT[] DEFAULT '{}',
    labels TEXT[] DEFAULT '{}',

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(255),
    completed_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT valid_story_points CHECK (story_points >= 0 AND story_points <= 100),
    CONSTRAINT valid_priority CHECK (priority >= 1 AND priority <= 5)
);

-- ============================================================================
-- ACCEPTANCE CRITERIA TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS acceptance_criteria (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,

    -- Given/When/Then format
    given_clause TEXT NOT NULL, -- Precondition
    when_clause TEXT NOT NULL, -- Action
    then_clause TEXT NOT NULL, -- Expected result

    -- Ordering and completion
    display_order INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_display_order CHECK (display_order >= 0)
);

-- ============================================================================
-- TASKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,

    -- Task content
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status task_status DEFAULT 'todo',

    -- Assignment and effort
    assigned_crew_member VARCHAR(50), -- Maps to crew_member enum
    estimated_hours DECIMAL(5,2) DEFAULT 0 CHECK (estimated_hours >= 0),
    actual_hours DECIMAL(5,2) DEFAULT 0 CHECK (actual_hours >= 0),

    -- Ordering
    display_order INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT valid_estimated_hours CHECK (estimated_hours >= 0),
    CONSTRAINT valid_actual_hours CHECK (actual_hours >= 0),
    CONSTRAINT valid_display_order CHECK (display_order >= 0)
);

-- ============================================================================
-- COMMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,

    -- Comment content
    content TEXT NOT NULL,
    author VARCHAR(255) NOT NULL, -- Username or crew member

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    edited BOOLEAN DEFAULT FALSE
);

-- ============================================================================
-- CREW WORKLOAD TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS crew_workload (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    crew_member VARCHAR(50) NOT NULL,
    sprint_id UUID REFERENCES sprints(id) ON DELETE CASCADE,

    -- Workload metrics
    total_story_points INTEGER DEFAULT 0,
    completed_story_points INTEGER DEFAULT 0,
    total_stories INTEGER DEFAULT 0,
    completed_stories INTEGER DEFAULT 0,
    capacity_percentage DECIMAL(5,2) DEFAULT 0, -- 0-100%

    -- Metadata
    last_calculated TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_capacity CHECK (capacity_percentage >= 0 AND capacity_percentage <= 100),
    CONSTRAINT unique_crew_sprint UNIQUE (crew_member, sprint_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Sprints indexes
CREATE INDEX IF NOT EXISTS idx_sprints_project_id ON sprints(project_id);
CREATE INDEX IF NOT EXISTS idx_sprints_status ON sprints(status);
CREATE INDEX IF NOT EXISTS idx_sprints_dates ON sprints(start_date, end_date);

-- Stories indexes
CREATE INDEX IF NOT EXISTS idx_stories_sprint_id ON stories(sprint_id);
CREATE INDEX IF NOT EXISTS idx_stories_project_id ON stories(project_id);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE INDEX IF NOT EXISTS idx_stories_assigned_crew ON stories(assigned_crew_member);
CREATE INDEX IF NOT EXISTS idx_stories_persona_id ON stories(persona_id);
CREATE INDEX IF NOT EXISTS idx_stories_priority ON stories(priority);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at);

-- Acceptance criteria indexes
CREATE INDEX IF NOT EXISTS idx_acceptance_criteria_story_id ON acceptance_criteria(story_id);
CREATE INDEX IF NOT EXISTS idx_acceptance_criteria_order ON acceptance_criteria(story_id, display_order);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_story_id ON tasks(story_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_crew ON tasks(assigned_crew_member);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_order ON tasks(story_id, display_order);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_story_id ON comments(story_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- Crew workload indexes
CREATE INDEX IF NOT EXISTS idx_crew_workload_crew_member ON crew_workload(crew_member);
CREATE INDEX IF NOT EXISTS idx_crew_workload_sprint_id ON crew_workload(sprint_id);

-- Personas indexes
CREATE INDEX IF NOT EXISTS idx_personas_type ON personas(type);
CREATE INDEX IF NOT EXISTS idx_personas_name ON personas(name);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to calculate crew workload
CREATE OR REPLACE FUNCTION calculate_crew_workload(
    p_sprint_id UUID,
    p_crew_member VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    crew_member VARCHAR,
    total_story_points INTEGER,
    completed_story_points INTEGER,
    total_stories BIGINT,
    completed_stories BIGINT,
    capacity_percentage DECIMAL
)
LANGUAGE SQL
AS $$
    SELECT
        assigned_crew_member as crew_member,
        COALESCE(SUM(story_points), 0)::INTEGER as total_story_points,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN story_points ELSE 0 END), 0)::INTEGER as completed_story_points,
        COUNT(*) as total_stories,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_stories,
        CASE
            WHEN SUM(story_points) > 0
            THEN ROUND((SUM(CASE WHEN status = 'completed' THEN story_points ELSE 0 END) / SUM(story_points)) * 100, 2)
            ELSE 0
        END as capacity_percentage
    FROM stories
    WHERE sprint_id = p_sprint_id
        AND assigned_crew_member IS NOT NULL
        AND (p_crew_member IS NULL OR assigned_crew_member = p_crew_member)
    GROUP BY assigned_crew_member;
$$;

-- Function to get sprint velocity
CREATE OR REPLACE FUNCTION get_sprint_velocity(p_sprint_id UUID)
RETURNS TABLE (
    velocity_target INTEGER,
    velocity_actual INTEGER,
    velocity_percentage DECIMAL,
    stories_planned BIGINT,
    stories_completed BIGINT
)
LANGUAGE SQL
AS $$
    SELECT
        s.velocity_target,
        s.velocity_actual,
        CASE
            WHEN s.velocity_target > 0
            THEN ROUND((s.velocity_actual::DECIMAL / s.velocity_target) * 100, 2)
            ELSE 0
        END as velocity_percentage,
        COUNT(st.id) as stories_planned,
        COUNT(CASE WHEN st.status = 'completed' THEN 1 END) as stories_completed
    FROM sprints s
    LEFT JOIN stories st ON st.sprint_id = s.id
    WHERE s.id = p_sprint_id
    GROUP BY s.id, s.velocity_target, s.velocity_actual;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated at triggers
CREATE TRIGGER update_sprints_updated_at BEFORE UPDATE ON sprints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON stories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_acceptance_criteria_updated_at BEFORE UPDATE ON acceptance_criteria
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personas_updated_at BEFORE UPDATE ON personas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE acceptance_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_workload ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all sprint data
CREATE POLICY "Allow read access to sprints" ON sprints
    FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow read access to stories" ON stories
    FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow read access to acceptance_criteria" ON acceptance_criteria
    FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow read access to tasks" ON tasks
    FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow read access to comments" ON comments
    FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow read access to personas" ON personas
    FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow read access to crew_workload" ON crew_workload
    FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Allow service role full access
CREATE POLICY "Allow service role full access to sprints" ON sprints
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to stories" ON stories
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to acceptance_criteria" ON acceptance_criteria
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to tasks" ON tasks
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to comments" ON comments
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to personas" ON personas
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to crew_workload" ON crew_workload
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- SEED DATA: PERSONAS
-- ============================================================================

-- User Personas
INSERT INTO personas (name, type, description, technical_level, goals, pain_points, preferred_crew_member) VALUES
('End User', 'user', 'Primary consumer of the product seeking simplicity and ease of use', 2,
    ARRAY['Complete tasks quickly', 'Intuitive interface', 'Reliable performance'],
    ARRAY['Complex interfaces', 'Slow software', 'Unclear instructions'],
    'troi'),

('Power User', 'user', 'Experienced user leveraging advanced features for productivity', 6,
    ARRAY['Maximize productivity with shortcuts', 'Automate repetitive tasks', 'Deep feature integration'],
    ARRAY['Limited customization', 'Missing power features', 'Slow workflows'],
    'troi'),

('Administrator', 'user', 'Manages system settings, user access, and security', 7,
    ARRAY['Control user access', 'Monitor system health', 'Ensure security compliance'],
    ARRAY['Complex admin panels', 'Lack of audit logs', 'Security vulnerabilities'],
    'worf'),

('Content Creator', 'user', 'Creates and publishes content using the platform', 4,
    ARRAY['Easy content creation', 'Creative tools', 'Fast publishing workflow'],
    ARRAY['Limited creative tools', 'Slow uploads', 'Poor editor UX'],
    'troi'),

('Developer', 'user', 'Technical user integrating via APIs or building extensions', 9,
    ARRAY['Comprehensive API documentation', 'Reliable endpoints', 'Easy authentication'],
    ARRAY['Poor API docs', 'Unreliable webhooks', 'Limited extensibility'],
    'uhura'),

('Enterprise Decision Maker', 'user', 'Evaluates ROI, security, and compliance for enterprise adoption', 3,
    ARRAY['Proven ROI', 'Enterprise security', 'Compliance certifications'],
    ARRAY['Unclear pricing', 'Security concerns', 'Vendor lock-in'],
    'quark'),

('Domain Specialist', 'user', 'Expert in specific domain (legal, healthcare, etc.) using the tool', 5,
    ARRAY['Domain-specific features', 'Accurate terminology', 'Compliance with regulations'],
    ARRAY['Generic features', 'Incorrect terminology', 'Non-compliant workflows'],
    'picard')
ON CONFLICT (name) DO NOTHING;

-- Developer Personas
INSERT INTO personas (name, type, description, technical_level, goals, pain_points, preferred_crew_member) VALUES
('Frontend Developer', 'developer', 'Builds user interfaces with React, TypeScript, and modern frameworks', 8,
    ARRAY['Clean component architecture', 'Responsive design', 'Accessibility compliance'],
    ARRAY['Poor design system', 'Performance issues', 'Browser compatibility'],
    'troi'),

('Backend Developer', 'developer', 'Builds APIs, databases, and server-side logic', 9,
    ARRAY['Scalable APIs', 'Efficient database queries', 'Clean architecture'],
    ARRAY['Slow queries', 'Poor error handling', 'Unclear requirements'],
    'data'),

('DevOps Engineer', 'developer', 'Manages infrastructure, CI/CD, monitoring, and deployments', 8,
    ARRAY['Reliable deployments', 'Fast CI/CD pipelines', 'Comprehensive monitoring'],
    ARRAY['Manual deployments', 'Slow builds', 'Poor observability'],
    'la_forge'),

('Full-Stack Developer', 'developer', 'Works across frontend, backend, and infrastructure', 8,
    ARRAY['End-to-end feature ownership', 'Cross-domain knowledge', 'Fast iteration'],
    ARRAY['Context switching', 'Broad but shallow expertise', 'Overwhelming scope'],
    'riker'),

('Designer (UI/UX)', 'developer', 'Designs user experiences, interfaces, and design systems', 7,
    ARRAY['User-centered design', 'Consistent design system', 'Accessibility'],
    ARRAY['Developer-UX misalignment', 'Inconsistent implementations', 'Missing user research'],
    'troi'),

('QA Engineer', 'developer', 'Tests software, writes automated tests, ensures quality', 7,
    ARRAY['Comprehensive test coverage', 'Fast feedback loops', 'Catch bugs early'],
    ARRAY['Slow manual testing', 'Flaky tests', 'Poor test documentation'],
    'worf')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Sprint System Database Schema Created Successfully';
    RAISE NOTICE '📋 Tables created: sprints, stories, acceptance_criteria, tasks, comments, personas, crew_workload';
    RAISE NOTICE '👥 Seeded 13 personas (7 user + 6 developer)';
    RAISE NOTICE '🔍 Indexes created for optimal query performance';
    RAISE NOTICE '🔒 Row Level Security (RLS) policies enabled';
    RAISE NOTICE '⚡ Functions created: calculate_crew_workload, get_sprint_velocity';
    RAISE NOTICE '🚀 Sprint System ready for implementation';
END $$;
