-- =====================================================
-- Alex AI RBAC Schema Migration (Fixed)
-- Version: 1.0.1
-- Date: 2025-12-26
-- Description: Complete RBAC system - standalone version
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: auth_profiles
-- Purpose: User profiles (standalone, not requiring auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS auth_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  system_role TEXT NOT NULL DEFAULT 'developer' CHECK (system_role IN ('administrator', 'owner', 'developer', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_auth_profiles_email ON auth_profiles(email);

-- =====================================================
-- TABLE: projects
-- Purpose: Project metadata with ownership
-- =====================================================
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE CASCADE,
  category_slug TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for owner lookups
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- =====================================================
-- TABLE: roles
-- Purpose: Role definitions with hierarchy and capabilities
-- =====================================================
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  hierarchy_level INTEGER NOT NULL UNIQUE CHECK (hierarchy_level >= 0 AND hierarchy_level <= 100),
  description TEXT,
  capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for hierarchy queries
CREATE INDEX IF NOT EXISTS idx_roles_hierarchy ON roles(hierarchy_level);

-- Insert predefined roles
INSERT INTO roles (id, name, hierarchy_level, description, capabilities) VALUES
(
  'administrator',
  'Administrator',
  100,
  'Full system access with user management and global configuration',
  '["system:manage_users", "system:manage_roles", "system:view_audit_logs", "system:configure", "project:create", "project:delete", "project:configure", "project:read", "project:write", "crew:chat", "crew:invoke", "code:read", "code:write", "code:execute"]'::jsonb
),
(
  'owner',
  'Project Owner',
  75,
  'Full access to owned projects with team management',
  '["project:create", "project:configure", "project:read", "project:write", "project:invite_members", "project:manage_members", "crew:chat", "crew:invoke", "code:read", "code:write", "code:execute"]'::jsonb
),
(
  'developer',
  'Developer',
  50,
  'Code access with read/write/execute permissions',
  '["project:read", "project:write", "crew:chat", "crew:invoke", "code:read", "code:write", "code:execute"]'::jsonb
),
(
  'viewer',
  'Viewer',
  25,
  'Read-only access to projects and code',
  '["project:read", "crew:chat", "code:read"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- TABLE: permissions
-- Purpose: All available permissions in the system
-- =====================================================
CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('system', 'project', 'crew', 'code')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert all permissions
INSERT INTO permissions (id, name, category, description) VALUES
-- System permissions
('perm_system_manage_users', 'system:manage_users', 'system', 'Create, update, delete users'),
('perm_system_manage_roles', 'system:manage_roles', 'system', 'Modify role definitions and assignments'),
('perm_system_view_audit', 'system:view_audit_logs', 'system', 'View system-wide audit logs'),
('perm_system_configure', 'system:configure', 'system', 'Modify system configuration'),

-- Project permissions
('perm_project_create', 'project:create', 'project', 'Create new projects'),
('perm_project_read', 'project:read', 'project', 'View project details'),
('perm_project_write', 'project:write', 'project', 'Update project details'),
('perm_project_delete', 'project:delete', 'project', 'Permanently delete projects'),
('perm_project_configure', 'project:configure', 'project', 'Configure project settings'),
('perm_project_invite', 'project:invite_members', 'project', 'Invite users to project'),
('perm_project_manage', 'project:manage_members', 'project', 'Manage project team members'),

-- Crew permissions
('perm_crew_chat', 'crew:chat', 'crew', 'Chat with AI crew members'),
('perm_crew_invoke', 'crew:invoke', 'crew', 'Invoke crew workflows'),

-- Code permissions
('perm_code_read', 'code:read', 'code', 'Read code and documentation'),
('perm_code_write', 'code:write', 'code', 'Write and modify code'),
('perm_code_execute', 'code:execute', 'code', 'Execute code and scripts')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- TABLE: project_members
-- Purpose: Project membership with roles
-- =====================================================
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES roles(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  invited_by UUID REFERENCES auth_profiles(id),
  joined_at TIMESTAMPTZ,
  UNIQUE(project_id, user_id)
);

-- Indexes for lookups
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);

-- =====================================================
-- TABLE: audit_log
-- Purpose: Track all permission checks and actions
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  permission_checked TEXT,
  granted BOOLEAN NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for querying
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id);

-- =====================================================
-- TABLE: api_keys
-- Purpose: API key management for VSCode extension
-- =====================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  name TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

-- =====================================================
-- TABLE: sessions
-- Purpose: Session management (optional)
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_active_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- =====================================================
-- RPC FUNCTION: check_permission
-- Purpose: Check if user has permission for action
-- =====================================================
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
  v_admin_hierarchy INTEGER := 100;
  v_has_capability BOOLEAN;
  v_project_role TEXT;
  v_project_role_hierarchy INTEGER;
BEGIN
  -- Get user's system role and hierarchy
  SELECT system_role INTO v_system_role
  FROM auth_profiles
  WHERE id = p_user_id;

  IF v_system_role IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT hierarchy_level INTO v_role_hierarchy
  FROM roles
  WHERE id = v_system_role;

  -- Administrators always have access
  IF v_role_hierarchy = v_admin_hierarchy THEN
    RETURN TRUE;
  END IF;

  -- Check system-level capabilities
  SELECT EXISTS (
    SELECT 1
    FROM roles
    WHERE id = v_system_role
    AND capabilities ? p_permission
  ) INTO v_has_capability;

  -- For non-project permissions, check system role
  IF p_project_id IS NULL THEN
    RETURN v_has_capability;
  END IF;

  -- For project-specific permissions, check project membership
  SELECT pm.role_id INTO v_project_role
  FROM project_members pm
  WHERE pm.project_id = p_project_id
  AND pm.user_id = p_user_id
  AND pm.joined_at IS NOT NULL;

  -- Check if user is project owner
  IF EXISTS (
    SELECT 1 FROM projects
    WHERE id = p_project_id
    AND owner_id = p_user_id
  ) THEN
    -- Project owners have owner-level permissions
    SELECT hierarchy_level INTO v_project_role_hierarchy
    FROM roles
    WHERE id = 'owner';

    SELECT EXISTS (
      SELECT 1
      FROM roles
      WHERE id = 'owner'
      AND capabilities ? p_permission
    ) INTO v_has_capability;

    RETURN v_has_capability;
  END IF;

  -- Check project role capabilities
  IF v_project_role IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM roles
      WHERE id = v_project_role
      AND capabilities ? p_permission
    ) INTO v_has_capability;

    RETURN v_has_capability;
  END IF;

  -- Default: no access
  RETURN FALSE;
END;
$$;

-- =====================================================
-- RPC FUNCTION: log_audit
-- Purpose: Log audit events
-- =====================================================
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
    user_id,
    action,
    resource_type,
    resource_id,
    permission_checked,
    granted,
    metadata
  ) VALUES (
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_permission_checked,
    p_granted,
    p_metadata
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$;

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE auth_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Auth Profiles: Users can read all profiles, but only admins can modify
CREATE POLICY auth_profiles_read ON auth_profiles
  FOR SELECT USING (true);

CREATE POLICY auth_profiles_update ON auth_profiles
  FOR UPDATE USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth_profiles
      WHERE id = auth.uid()
      AND system_role = 'administrator'
    )
  );

-- Projects: Users can see projects they own or are members of
CREATE POLICY projects_read ON projects
  FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = projects.id
      AND user_id = auth.uid()
      AND joined_at IS NOT NULL
    )
  );

CREATE POLICY projects_insert ON projects
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY projects_update ON projects
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY projects_delete ON projects
  FOR DELETE USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth_profiles
      WHERE id = auth.uid()
      AND system_role = 'administrator'
    )
  );

-- Project Members: Can see memberships for projects they're part of
CREATE POLICY project_members_read ON project_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_members.project_id
      AND owner_id = auth.uid()
    )
  );

-- Audit Log: Users can see their own audit logs, admins see all
CREATE POLICY audit_log_read ON audit_log
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth_profiles
      WHERE id = auth.uid()
      AND system_role = 'administrator'
    )
  );

-- API Keys: Users can only see their own API keys
CREATE POLICY api_keys_read ON api_keys
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY api_keys_insert ON api_keys
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY api_keys_update ON api_keys
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY api_keys_delete ON api_keys
  FOR DELETE USING (user_id = auth.uid());

-- Sessions: Users can only see their own sessions
CREATE POLICY sessions_read ON sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY sessions_delete ON sessions
  FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- Grant necessary permissions
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Grant table permissions
GRANT ALL ON auth_profiles TO authenticated;
GRANT ALL ON projects TO authenticated;
GRANT ALL ON roles TO authenticated;
GRANT ALL ON permissions TO authenticated;
GRANT ALL ON project_members TO authenticated;
GRANT ALL ON audit_log TO authenticated;
GRANT ALL ON api_keys TO authenticated;
GRANT ALL ON sessions TO authenticated;

-- Grant sequence permissions (for auto-increment IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION check_permission TO authenticated, anon;
GRANT EXECUTE ON FUNCTION log_audit TO authenticated, anon;
