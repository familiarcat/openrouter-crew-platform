-- =====================================================
-- Alex AI - Complete RBAC Schema with Full Ownership Tracking
-- Version: 2.0.0
-- Date: 2025-12-26
-- Description: Comprehensive ownership and access control across all entities
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- =====================================================
-- CORE: User Accounts and Authentication
-- =====================================================

-- Users table (standalone - no dependency on Supabase Auth)
CREATE TABLE IF NOT EXISTS auth_profiles (
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

-- =====================================================
-- RBAC: Roles and Permissions
-- =====================================================

-- Role definitions
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  hierarchy_level INTEGER NOT NULL UNIQUE CHECK (hierarchy_level >= 0 AND hierarchy_level <= 100),
  description TEXT,
  capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth_profiles(id), -- Track who created custom roles
  is_system_role BOOLEAN DEFAULT true -- System vs custom roles
);

CREATE INDEX idx_roles_hierarchy ON roles(hierarchy_level);

-- Permission definitions
CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('system', 'project', 'crew', 'code', 'data')),
  description TEXT,
  resource_type TEXT, -- What this permission applies to
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_permissions_category ON permissions(category);
CREATE INDEX idx_permissions_resource ON permissions(resource_type);

-- =====================================================
-- PROJECTS: Full Ownership Hierarchy
-- =====================================================

-- Projects with clear ownership
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,

  -- Ownership
  owner_id UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth_profiles(id),

  -- Metadata
  category_slug TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted', 'template')),
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'public')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX idx_projects_owner ON projects(owner_id) WHERE status != 'deleted';
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_visibility ON projects(visibility);
CREATE INDEX idx_projects_created_by ON projects(created_by);

-- Project members (team access)
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES roles(id),

  -- Invitation tracking
  invited_by UUID NOT NULL REFERENCES auth_profiles(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,

  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_project_members_project ON project_members(project_id) WHERE left_at IS NULL;
CREATE INDEX idx_project_members_user ON project_members(user_id) WHERE left_at IS NULL;
CREATE INDEX idx_project_members_role ON project_members(role_id);

-- =====================================================
-- CREW: AI Agents and Missions
-- =====================================================

-- Crew members (AI agents)
CREATE TABLE IF NOT EXISTS crew_members (
  crew_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rank TEXT,
  role TEXT NOT NULL,
  department TEXT,

  -- Customization (for user-created crew)
  created_by UUID REFERENCES auth_profiles(id), -- NULL for system crew
  is_system_crew BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,

  -- Personality
  archetype TEXT,
  traits JSONB DEFAULT '[]'::jsonb,
  catchphrases JSONB DEFAULT '[]'::jsonb,
  personality_description TEXT,

  -- Expertise
  primary_expertise TEXT[] DEFAULT '{}',
  secondary_expertise TEXT[] DEFAULT '{}',
  years_experience INTEGER,

  -- AI Configuration
  preferred_models JSONB DEFAULT '[]'::jsonb,
  system_prompt TEXT,
  temperature DECIMAL(3,2) DEFAULT 0.7,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crew_members_role ON crew_members(role) WHERE is_active = true;
CREATE INDEX idx_crew_members_department ON crew_members(department) WHERE is_active = true;
CREATE INDEX idx_crew_members_created_by ON crew_members(created_by);

-- Crew missions (task assignments)
CREATE TABLE IF NOT EXISTS crew_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Ownership
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth_profiles(id),
  assigned_to TEXT NOT NULL REFERENCES crew_members(crew_id),

  -- Mission details
  title TEXT NOT NULL,
  description TEXT,
  mission_type TEXT CHECK (mission_type IN ('feature', 'bugfix', 'refactor', 'research', 'review')),
  priority INTEGER CHECK (priority BETWEEN 1 AND 5) DEFAULT 3,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'review', 'completed', 'blocked', 'cancelled')),

  -- Dependencies and artifacts
  dependencies UUID[], -- Mission IDs
  artifacts JSONB DEFAULT '[]'::jsonb, -- Files created/modified
  results JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  deadline_at TIMESTAMPTZ
);

CREATE INDEX idx_crew_missions_project ON crew_missions(project_id);
CREATE INDEX idx_crew_missions_created_by ON crew_missions(created_by);
CREATE INDEX idx_crew_missions_assigned_to ON crew_missions(assigned_to);
CREATE INDEX idx_crew_missions_status ON crew_missions(status);

-- =====================================================
-- SECURITY: API Keys and Sessions
-- =====================================================

-- API keys for authentication
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Ownership
  user_id UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE CASCADE,

  -- Key data (hashed)
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  name TEXT NOT NULL,

  -- Scopes and permissions
  scopes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash) WHERE revoked_at IS NULL;
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);

-- User sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Ownership
  user_id UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE CASCADE,

  -- Session data
  token_hash TEXT NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_active_at TIMESTAMPTZ
);

CREATE INDEX idx_sessions_user ON sessions(user_id) WHERE expires_at > NOW();
CREATE INDEX idx_sessions_hash ON sessions(token_hash) WHERE expires_at > NOW();
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- =====================================================
-- AUDIT: Complete Activity Tracking
-- =====================================================

-- Audit log with full context
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Who (required)
  user_id UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE CASCADE,

  -- What
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  permission_checked TEXT,
  granted BOOLEAN NOT NULL,

  -- Context
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- When
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);

-- =====================================================
-- CONTENT: Files, Assets, and Artifacts
-- =====================================================

-- Files and documents
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Ownership
  owner_id UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,

  -- File data
  path TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- file extension or MIME type
  size_bytes BIGINT,
  content_hash TEXT, -- SHA-256 for deduplication

  -- Storage
  storage_location TEXT, -- local, s3, supabase, etc.
  storage_key TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[],

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  UNIQUE(project_id, path)
);

CREATE INDEX idx_files_owner ON files(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_project ON files(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_path ON files(path);
CREATE INDEX idx_files_hash ON files(content_hash);

-- Recommendations and plans
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Ownership
  created_by UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  crew_member TEXT REFERENCES crew_members(crew_id),

  -- Content
  title TEXT NOT NULL,
  description TEXT,
  recommendation_type TEXT CHECK (recommendation_type IN ('feature', 'improvement', 'bugfix', 'security', 'performance')),
  priority INTEGER CHECK (priority BETWEEN 1 AND 5) DEFAULT 3,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'implemented')),

  -- Context
  files_affected TEXT[],
  estimated_effort TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recommendations_created_by ON recommendations(created_by);
CREATE INDEX idx_recommendations_project ON recommendations(project_id);
CREATE INDEX idx_recommendations_crew ON recommendations(crew_member);
CREATE INDEX idx_recommendations_status ON recommendations(status);

-- =====================================================
-- SITEMAPS: Website Structure Tracking
-- =====================================================

-- Sitemaps for projects
CREATE TABLE IF NOT EXISTS sitemaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Ownership
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth_profiles(id),

  -- Sitemap data
  name TEXT NOT NULL,
  source_url TEXT, -- Original sitemap URL if imported
  source_type TEXT CHECK (source_type IN ('wordpress', 'nextjs', 'custom', 'manual')),
  structure JSONB NOT NULL DEFAULT '{}'::jsonb, -- Full sitemap structure

  -- Metadata
  node_count INTEGER,
  last_parsed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sitemaps_project ON sitemaps(project_id);
CREATE INDEX idx_sitemaps_created_by ON sitemaps(created_by);

-- Sitemap nodes (for detailed querying)
CREATE TABLE IF NOT EXISTS sitemap_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Ownership
  sitemap_id UUID NOT NULL REFERENCES sitemaps(id) ON DELETE CASCADE,

  -- Node data
  node_id TEXT NOT NULL, -- Internal node identifier
  url TEXT NOT NULL,
  title TEXT,
  node_type TEXT CHECK (node_type IN ('page', 'post', 'category', 'asset', 'section')),
  parent_id UUID REFERENCES sitemap_nodes(id),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  depth INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(sitemap_id, node_id)
);

CREATE INDEX idx_sitemap_nodes_sitemap ON sitemap_nodes(sitemap_id);
CREATE INDEX idx_sitemap_nodes_parent ON sitemap_nodes(parent_id);
CREATE INDEX idx_sitemap_nodes_type ON sitemap_nodes(node_type);

-- =====================================================
-- SEED: System Roles and Permissions
-- =====================================================

-- Insert system roles
INSERT INTO roles (id, name, hierarchy_level, description, capabilities, is_system_role) VALUES
(
  'administrator',
  'Administrator',
  100,
  'Full system access with user management and global configuration',
  '["system:manage_users", "system:manage_roles", "system:view_audit_logs", "system:configure", "project:create", "project:delete", "project:configure", "project:read", "project:write", "project:invite_members", "project:manage_members", "crew:chat", "crew:invoke", "crew:manage", "code:read", "code:write", "code:execute", "data:read", "data:write", "data:delete"]'::jsonb,
  true
),
(
  'owner',
  'Project Owner',
  75,
  'Full access to owned projects with team management',
  '["project:create", "project:configure", "project:read", "project:write", "project:invite_members", "project:manage_members", "crew:chat", "crew:invoke", "code:read", "code:write", "code:execute", "data:read", "data:write"]'::jsonb,
  true
),
(
  'developer',
  'Developer',
  50,
  'Code access with read/write/execute permissions',
  '["project:read", "project:write", "crew:chat", "crew:invoke", "code:read", "code:write", "code:execute", "data:read", "data:write"]'::jsonb,
  true
),
(
  'viewer',
  'Viewer',
  25,
  'Read-only access to projects and code',
  '["project:read", "crew:chat", "code:read", "data:read"]'::jsonb,
  true
)
ON CONFLICT (id) DO NOTHING;

-- Insert system permissions
INSERT INTO permissions (id, name, category, description, resource_type) VALUES
-- System permissions
('perm_system_manage_users', 'system:manage_users', 'system', 'Create, update, delete users', 'user'),
('perm_system_manage_roles', 'system:manage_roles', 'system', 'Modify role definitions', 'role'),
('perm_system_view_audit', 'system:view_audit_logs', 'system', 'View system-wide audit logs', 'audit'),
('perm_system_configure', 'system:configure', 'system', 'Modify system configuration', 'system'),

-- Project permissions
('perm_project_create', 'project:create', 'project', 'Create new projects', 'project'),
('perm_project_read', 'project:read', 'project', 'View project details', 'project'),
('perm_project_write', 'project:write', 'project', 'Update project details', 'project'),
('perm_project_delete', 'project:delete', 'project', 'Delete projects', 'project'),
('perm_project_configure', 'project:configure', 'project', 'Configure project settings', 'project'),
('perm_project_invite', 'project:invite_members', 'project', 'Invite users to project', 'project'),
('perm_project_manage', 'project:manage_members', 'project', 'Manage project members', 'project'),

-- Crew permissions
('perm_crew_chat', 'crew:chat', 'crew', 'Chat with AI crew', 'crew'),
('perm_crew_invoke', 'crew:invoke', 'crew', 'Invoke crew workflows', 'crew'),
('perm_crew_manage', 'crew:manage', 'crew', 'Manage crew members', 'crew'),

-- Code permissions
('perm_code_read', 'code:read', 'code', 'Read code', 'file'),
('perm_code_write', 'code:write', 'code', 'Write code', 'file'),
('perm_code_execute', 'code:execute', 'code', 'Execute code', 'file'),

-- Data permissions
('perm_data_read', 'data:read', 'data', 'Read data', 'data'),
('perm_data_write', 'data:write', 'data', 'Write data', 'data'),
('perm_data_delete', 'data:delete', 'data', 'Delete data', 'data')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- FUNCTIONS: Permission Checking and Auditing
-- =====================================================

-- Check if user has permission
CREATE OR REPLACE FUNCTION check_permission(
  p_user_id UUID,
  p_permission TEXT,
  p_project_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_system_role TEXT;
  v_role_hierarchy INTEGER;
  v_has_capability BOOLEAN;
  v_project_role TEXT;
BEGIN
  -- Get user's system role
  SELECT system_role INTO v_system_role
  FROM auth_profiles
  WHERE id = p_user_id AND is_active = true;

  IF v_system_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get role hierarchy
  SELECT hierarchy_level INTO v_role_hierarchy
  FROM roles
  WHERE id = v_system_role;

  -- Administrators always have access
  IF v_role_hierarchy = 100 THEN
    RETURN TRUE;
  END IF;

  -- Check system-level capabilities
  SELECT EXISTS (
    SELECT 1 FROM roles
    WHERE id = v_system_role
    AND capabilities ? p_permission
  ) INTO v_has_capability;

  -- For non-project permissions, check system role
  IF p_project_id IS NULL THEN
    RETURN v_has_capability;
  END IF;

  -- Check if user owns the project
  IF EXISTS (
    SELECT 1 FROM projects
    WHERE id = p_project_id AND owner_id = p_user_id
  ) THEN
    SELECT EXISTS (
      SELECT 1 FROM roles
      WHERE id = 'owner'
      AND capabilities ? p_permission
    ) INTO v_has_capability;
    RETURN v_has_capability;
  END IF;

  -- Check project membership
  SELECT pm.role_id INTO v_project_role
  FROM project_members pm
  WHERE pm.project_id = p_project_id
  AND pm.user_id = p_user_id
  AND pm.joined_at IS NOT NULL
  AND pm.left_at IS NULL;

  IF v_project_role IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM roles
      WHERE id = v_project_role
      AND capabilities ? p_permission
    ) INTO v_has_capability;
    RETURN v_has_capability;
  END IF;

  RETURN FALSE;
END;
$$;

-- Log audit events
CREATE OR REPLACE FUNCTION log_audit(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT,
  p_permission_checked TEXT,
  p_granted BOOLEAN,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_log (
    user_id, action, resource_type, resource_id,
    permission_checked, granted, metadata
  ) VALUES (
    p_user_id, p_action, p_resource_type, p_resource_id,
    p_permission_checked, p_granted, p_metadata
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$;

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_auth_profiles_timestamp
  BEFORE UPDATE ON auth_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_projects_timestamp
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_crew_members_timestamp
  BEFORE UPDATE ON crew_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_files_timestamp
  BEFORE UPDATE ON files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sitemaps_timestamp
  BEFORE UPDATE ON sitemaps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Alex AI RBAC Schema v2.0 - Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables created: 15';
  RAISE NOTICE 'With full ownership tracking';
  RAISE NOTICE 'Ready for data seeding';
  RAISE NOTICE '========================================';
END $$;
