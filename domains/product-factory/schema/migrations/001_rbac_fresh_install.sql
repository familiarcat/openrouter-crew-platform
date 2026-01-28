-- =====================================================
-- Alex AI - Complete RBAC Schema with Full Ownership Tracking
-- Version: 2.0.1 - PRODUCTION GRADE
-- Date: 2025-12-26
-- Description: Fresh install with proper dependency handling
-- =====================================================

-- =====================================================
-- STEP 1: CLEAN SLATE - Drop all tables in reverse dependency order
-- =====================================================

DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS recommendations CASCADE;
DROP TABLE IF EXISTS sitemap_nodes CASCADE;
DROP TABLE IF EXISTS sitemaps CASCADE;
DROP TABLE IF EXISTS files CASCADE;
DROP TABLE IF EXISTS crew_missions CASCADE;
DROP TABLE IF EXISTS crew_members CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS auth_profiles CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS check_permission(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS log_audit(UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN, JSONB);
DROP FUNCTION IF EXISTS get_user_role(UUID, TEXT);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- =====================================================
-- STEP 2: Enable required extensions
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- =====================================================
-- STEP 3: Core Tables - User Authentication
-- =====================================================

-- Users table (standalone - no dependency on Supabase Auth)
CREATE TABLE auth_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  system_role TEXT NOT NULL DEFAULT 'developer'
    CHECK (system_role IN ('administrator', 'owner', 'developer', 'viewer')),
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_auth_profiles_email ON auth_profiles(email);
CREATE INDEX idx_auth_profiles_system_role ON auth_profiles(system_role) WHERE is_active = true;

COMMENT ON TABLE auth_profiles IS 'User accounts with system-wide roles';
COMMENT ON COLUMN auth_profiles.system_role IS 'System-wide role: administrator, owner, developer, or viewer';

-- =====================================================
-- STEP 4: RBAC Tables - Roles and Permissions
-- =====================================================

-- Role definitions
CREATE TABLE roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  hierarchy_level INTEGER NOT NULL UNIQUE CHECK (hierarchy_level >= 0 AND hierarchy_level <= 100),
  description TEXT,
  capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth_profiles(id) ON DELETE SET NULL,
  is_system_role BOOLEAN DEFAULT true
);

CREATE INDEX idx_roles_hierarchy ON roles(hierarchy_level);

COMMENT ON TABLE roles IS 'Role definitions with hierarchy levels';
COMMENT ON COLUMN roles.hierarchy_level IS 'Higher number = more permissions (0=viewer, 100=admin)';

-- Permission definitions
CREATE TABLE permissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('system', 'project', 'crew', 'code', 'data')),
  description TEXT,
  resource_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_permissions_category ON permissions(category);
CREATE INDEX idx_permissions_resource ON permissions(resource_type);

COMMENT ON TABLE permissions IS 'Granular permission definitions';

-- Role-Permission mapping
CREATE TABLE role_permissions (
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

-- =====================================================
-- STEP 5: Projects with Full Ownership
-- =====================================================

-- Projects with clear ownership
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,

  -- Ownership
  owner_id UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE RESTRICT,

  -- Metadata
  category_slug TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted', 'template')),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'public')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX idx_projects_owner ON projects(owner_id) WHERE status != 'deleted';
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_visibility ON projects(visibility);
CREATE INDEX idx_projects_created_by ON projects(created_by);

COMMENT ON TABLE projects IS 'Projects with owner and creator tracking';
COMMENT ON COLUMN projects.owner_id IS 'Current owner (can be transferred)';
COMMENT ON COLUMN projects.created_by IS 'Original creator (immutable)';

-- Project members (team access)
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,

  -- Invitation tracking
  invited_by UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE RESTRICT,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,

  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);
CREATE INDEX idx_project_members_role ON project_members(role_id);

COMMENT ON TABLE project_members IS 'Team members for projects with role assignments';

-- =====================================================
-- STEP 6: Crew System
-- =====================================================

-- Crew members (Star Trek themed AI personas)
CREATE TABLE crew_members (
  crew_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT,
  expertise TEXT[] NOT NULL DEFAULT '{}',
  system_prompt TEXT,
  temperature REAL DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens INTEGER DEFAULT 2000,
  is_system_crew BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crew_members_department ON crew_members(department);
CREATE INDEX idx_crew_members_expertise ON crew_members USING GIN(expertise);

COMMENT ON TABLE crew_members IS 'AI crew members with specialized expertise';

-- Crew missions (task assignments)
CREATE TABLE crew_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE RESTRICT,
  assigned_to TEXT NOT NULL REFERENCES crew_members(crew_id) ON DELETE RESTRICT,

  title TEXT NOT NULL,
  description TEXT,
  context JSONB DEFAULT '{}'::jsonb,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
  priority TEXT DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  result JSONB,
  error_message TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_crew_missions_project ON crew_missions(project_id);
CREATE INDEX idx_crew_missions_assigned_to ON crew_missions(assigned_to);
CREATE INDEX idx_crew_missions_created_by ON crew_missions(created_by);
CREATE INDEX idx_crew_missions_status ON crew_missions(status) WHERE status != 'completed';

COMMENT ON TABLE crew_missions IS 'Task assignments for crew members';

-- =====================================================
-- STEP 7: Files and Sitemaps
-- =====================================================

-- Files with ownership
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,

  path TEXT NOT NULL,
  name TEXT NOT NULL,
  extension TEXT,
  size_bytes BIGINT,
  mime_type TEXT,

  content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(project_id, path)
);

CREATE INDEX idx_files_owner ON files(owner_id);
CREATE INDEX idx_files_project ON files(project_id);
CREATE INDEX idx_files_path ON files(path);
CREATE INDEX idx_files_extension ON files(extension);

COMMENT ON TABLE files IS 'File tracking with ownership and project association';

-- Sitemaps with ownership
CREATE TABLE sitemaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE RESTRICT,

  name TEXT NOT NULL,
  description TEXT,
  source_url TEXT,
  structure JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sitemaps_project ON sitemaps(project_id);
CREATE INDEX idx_sitemaps_created_by ON sitemaps(created_by);

COMMENT ON TABLE sitemaps IS 'Sitemap structures with creator tracking';

-- Sitemap nodes (individual pages/nodes)
CREATE TABLE sitemap_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sitemap_id UUID NOT NULL REFERENCES sitemaps(id) ON DELETE CASCADE,

  node_type TEXT NOT NULL CHECK (node_type IN ('page', 'section', 'category', 'asset')),
  url TEXT,
  title TEXT,
  parent_id UUID REFERENCES sitemap_nodes(id) ON DELETE CASCADE,

  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sitemap_nodes_sitemap ON sitemap_nodes(sitemap_id);
CREATE INDEX idx_sitemap_nodes_parent ON sitemap_nodes(parent_id);
CREATE INDEX idx_sitemap_nodes_type ON sitemap_nodes(node_type);

COMMENT ON TABLE sitemap_nodes IS 'Individual nodes within sitemaps';

-- =====================================================
-- STEP 8: Recommendations
-- =====================================================

-- AI recommendations with attribution
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  crew_member TEXT REFERENCES crew_members(crew_id) ON DELETE SET NULL,

  title TEXT NOT NULL,
  description TEXT,
  rationale TEXT,
  implementation TEXT,

  category TEXT CHECK (category IN ('architecture', 'security', 'performance', 'ux', 'code_quality', 'business')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'implemented')),

  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recommendations_created_by ON recommendations(created_by);
CREATE INDEX idx_recommendations_project ON recommendations(project_id);
CREATE INDEX idx_recommendations_crew ON recommendations(crew_member);
CREATE INDEX idx_recommendations_status ON recommendations(status) WHERE status = 'pending';

COMMENT ON TABLE recommendations IS 'AI-generated recommendations with crew attribution';

-- =====================================================
-- STEP 9: Authentication - API Keys and Sessions
-- =====================================================

-- API keys with ownership
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE CASCADE,

  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  name TEXT,

  scopes TEXT[] DEFAULT '{}',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash) WHERE revoked_at IS NULL;
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);

COMMENT ON TABLE api_keys IS 'API key authentication with SHA-256 hashing';
COMMENT ON COLUMN api_keys.key_hash IS 'SHA-256 hash of the API key';
COMMENT ON COLUMN api_keys.key_prefix IS 'First 8 chars for identification (alex_xxx)';

-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE CASCADE,

  token_hash TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_active_at TIMESTAMPTZ
);

CREATE INDEX idx_sessions_user ON sessions(user_id) WHERE expires_at > NOW();
CREATE INDEX idx_sessions_hash ON sessions(token_hash) WHERE expires_at > NOW();
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

COMMENT ON TABLE sessions IS 'User sessions with token hashing';

-- =====================================================
-- STEP 10: Audit Logging
-- =====================================================

-- Audit log with full context
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Who (required)
  user_id UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE CASCADE,

  -- What (required)
  operation TEXT NOT NULL,

  -- Where (optional - what resource was affected)
  entity_type TEXT,
  entity_id TEXT,

  -- Context (optional)
  context TEXT,
  result BOOLEAN,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- When
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_operation ON audit_log(operation);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

COMMENT ON TABLE audit_log IS 'Complete audit trail of all user actions';

-- =====================================================
-- STEP 11: Seed System Data
-- =====================================================

-- Insert default roles
INSERT INTO roles (id, name, hierarchy_level, description, is_system_role) VALUES
  ('administrator', 'Administrator', 100, 'Full system access', true),
  ('owner', 'Owner', 75, 'Project ownership and management', true),
  ('developer', 'Developer', 50, 'Build and modify code', true),
  ('viewer', 'Viewer', 25, 'Read-only access', true)
ON CONFLICT (id) DO NOTHING;

-- Insert granular permissions
INSERT INTO permissions (id, name, category, resource_type, description) VALUES
  -- System permissions
  ('system:manage', 'Manage System', 'system', 'system', 'Full system administration'),
  ('users:manage', 'Manage Users', 'system', 'users', 'Create, update, delete users'),
  ('settings:manage', 'Manage Settings', 'system', 'settings', 'Configure system settings'),

  -- Project permissions
  ('projects:create', 'Create Projects', 'project', 'projects', 'Create new projects'),
  ('projects:read', 'Read Projects', 'project', 'projects', 'View project details'),
  ('projects:update', 'Update Projects', 'project', 'projects', 'Modify project details'),
  ('projects:delete', 'Delete Projects', 'project', 'projects', 'Delete projects'),

  -- Data permissions
  ('data:read', 'Read Data', 'data', 'files', 'View files and data'),
  ('data:write', 'Write Data', 'data', 'files', 'Create and modify files'),
  ('data:delete', 'Delete Data', 'data', 'files', 'Delete files and data'),

  -- Crew permissions
  ('crew:manage', 'Manage Crew', 'crew', 'crew_members', 'Manage crew members and missions'),
  ('crew:assign', 'Assign Missions', 'crew', 'crew_missions', 'Assign tasks to crew members')
ON CONFLICT (id) DO NOTHING;

-- Map permissions to roles
INSERT INTO role_permissions (role_id, permission_id) VALUES
  -- Administrator: All permissions
  ('administrator', 'system:manage'),
  ('administrator', 'users:manage'),
  ('administrator', 'settings:manage'),
  ('administrator', 'projects:create'),
  ('administrator', 'projects:read'),
  ('administrator', 'projects:update'),
  ('administrator', 'projects:delete'),
  ('administrator', 'data:read'),
  ('administrator', 'data:write'),
  ('administrator', 'data:delete'),
  ('administrator', 'crew:manage'),
  ('administrator', 'crew:assign'),

  -- Owner: Project and crew management
  ('owner', 'projects:create'),
  ('owner', 'projects:read'),
  ('owner', 'projects:update'),
  ('owner', 'projects:delete'),
  ('owner', 'data:read'),
  ('owner', 'data:write'),
  ('owner', 'data:delete'),
  ('owner', 'crew:manage'),
  ('owner', 'crew:assign'),

  -- Developer: Build and modify
  ('developer', 'projects:read'),
  ('developer', 'projects:update'),
  ('developer', 'data:read'),
  ('developer', 'data:write'),
  ('developer', 'data:delete'),
  ('developer', 'crew:assign'),

  -- Viewer: Read-only
  ('viewer', 'projects:read'),
  ('viewer', 'data:read')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Insert Star Trek crew members
INSERT INTO crew_members (crew_id, name, role, department, expertise) VALUES
  ('picard', 'Captain Jean-Luc Picard', 'Captain', 'Command', ARRAY['strategy', 'leadership', 'diplomacy']),
  ('riker', 'Commander William Riker', 'First Officer', 'Command', ARRAY['tactics', 'execution', 'problem_solving']),
  ('data', 'Lieutenant Commander Data', 'Operations Officer', 'Operations', ARRAY['analysis', 'computation', 'logic']),
  ('geordi', 'Lieutenant Commander Geordi La Forge', 'Chief Engineer', 'Engineering', ARRAY['systems', 'infrastructure', 'debugging']),
  ('troi', 'Counselor Deanna Troi', 'Ship''s Counselor', 'Medical', ARRAY['user_experience', 'communication', 'empathy']),
  ('worf', 'Lieutenant Worf', 'Security Chief', 'Security', ARRAY['security', 'testing', 'quality_assurance']),
  ('obrien', 'Chief Miles O''Brien', 'Transporter Chief', 'Engineering', ARRAY['operations', 'maintenance', 'practical_solutions']),
  ('quark', 'Quark', 'Business Owner', 'Civilian', ARRAY['business', 'negotiation', 'profit_optimization'])
ON CONFLICT (crew_id) DO NOTHING;

-- =====================================================
-- STEP 12: Database Functions
-- =====================================================

-- Function: Check if user has permission
CREATE OR REPLACE FUNCTION check_permission(
  p_user_id UUID,
  p_permission TEXT,
  p_project_id TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN;
  v_system_role TEXT;
BEGIN
  -- Get user's system role
  SELECT system_role INTO v_system_role
  FROM auth_profiles
  WHERE id = p_user_id AND is_active = true;

  IF v_system_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if user's role has the permission
  SELECT EXISTS (
    SELECT 1
    FROM role_permissions rp
    JOIN roles r ON r.id = rp.role_id
    WHERE rp.permission_id = p_permission
      AND r.id = v_system_role
  ) INTO v_has_permission;

  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_permission IS 'Check if user has a specific permission';

-- Function: Log audit event
CREATE OR REPLACE FUNCTION log_audit(
  p_user_id UUID,
  p_operation TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id TEXT DEFAULT NULL,
  p_context TEXT DEFAULT NULL,
  p_result BOOLEAN DEFAULT true,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_log (
    user_id, operation, entity_type, entity_id,
    context, result, metadata
  ) VALUES (
    p_user_id, p_operation, p_entity_type, p_entity_id,
    p_context, p_result, p_metadata
  ) RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_audit IS 'Create audit log entry';

-- Function: Get user's role in project
CREATE OR REPLACE FUNCTION get_user_role(
  p_user_id UUID,
  p_project_id TEXT
) RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Check if user is project owner
  SELECT system_role INTO v_role
  FROM auth_profiles ap
  JOIN projects p ON p.owner_id = ap.id
  WHERE ap.id = p_user_id AND p.id = p_project_id;

  IF v_role IS NOT NULL THEN
    RETURN v_role;
  END IF;

  -- Check if user is project member
  SELECT r.id INTO v_role
  FROM project_members pm
  JOIN roles r ON r.id = pm.role_id
  WHERE pm.user_id = p_user_id
    AND pm.project_id = p_project_id
    AND pm.left_at IS NULL;

  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_role IS 'Get user''s role in a specific project';

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 13: Triggers
-- =====================================================

-- Trigger: Update updated_at on auth_profiles
CREATE TRIGGER trigger_auth_profiles_updated_at
  BEFORE UPDATE ON auth_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update updated_at on projects
CREATE TRIGGER trigger_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update updated_at on files
CREATE TRIGGER trigger_files_updated_at
  BEFORE UPDATE ON files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update updated_at on sitemaps
CREATE TRIGGER trigger_sitemaps_updated_at
  BEFORE UPDATE ON sitemaps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update updated_at on recommendations
CREATE TRIGGER trigger_recommendations_updated_at
  BEFORE UPDATE ON recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 14: Row Level Security (RLS) - DISABLED
-- =====================================================
-- NOTE: RLS is NOT enabled because we're using application-level
-- authorization via middleware. This provides more flexibility
-- for API key authentication and custom auth flows.
--
-- To enable RLS in the future, uncomment these lines:
--
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY projects_select ON projects FOR SELECT USING (
--   owner_id = auth.uid() OR
--   id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
-- );

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify installation
DO $$
DECLARE
  v_table_count INTEGER;
  v_function_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';

  SELECT COUNT(*) INTO v_function_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN ('check_permission', 'log_audit', 'get_user_role', 'update_updated_at_column');

  RAISE NOTICE 'Migration Complete!';
  RAISE NOTICE 'Tables created: %', v_table_count;
  RAISE NOTICE 'Functions created: %', v_function_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Verify: SELECT * FROM roles;';
  RAISE NOTICE '2. Verify: SELECT * FROM permissions;';
  RAISE NOTICE '3. Verify: SELECT * FROM crew_members;';
END $$;
