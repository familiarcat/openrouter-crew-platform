-- =====================================================
-- Alex AI RBAC Schema Migration
-- Version: 1.0.0
-- Date: 2025-12-26
-- Description: Complete RBAC system with hierarchical roles
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: auth_profiles
-- Purpose: Extended user profile with system-wide role
-- =====================================================
CREATE TABLE IF NOT EXISTS auth_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  system_role TEXT NOT NULL DEFAULT 'developer' CHECK (system_role IN ('administrator', 'owner', 'developer', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast email lookups
CREATE INDEX idx_auth_profiles_email ON auth_profiles(email);

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
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);

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
CREATE INDEX idx_roles_hierarchy ON roles(hierarchy_level);

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

-- Index for category queries
CREATE INDEX idx_permissions_category ON permissions(category);

-- Insert all permissions
INSERT INTO permissions (id, name, category, description) VALUES
-- System permissions
('perm_system_manage_users', 'system:manage_users', 'system', 'Create, edit, delete users'),
('perm_system_manage_roles', 'system:manage_roles', 'system', 'Modify role definitions and assignments'),
('perm_system_view_audit_logs', 'system:view_audit_logs', 'system', 'View system-wide audit logs'),
('perm_system_configure', 'system:configure', 'system', 'Modify system-wide configuration'),

-- Project permissions
('perm_project_create', 'project:create', 'project', 'Create new projects'),
('perm_project_delete', 'project:delete', 'project', 'Delete projects'),
('perm_project_configure', 'project:configure', 'project', 'Modify project settings'),
('perm_project_read', 'project:read', 'project', 'View project data'),
('perm_project_write', 'project:write', 'project', 'Edit project data'),
('perm_project_invite_members', 'project:invite_members', 'project', 'Invite users to project'),
('perm_project_manage_members', 'project:manage_members', 'project', 'Manage project member roles'),

-- Crew permissions
('perm_crew_chat', 'crew:chat', 'crew', 'Chat with AI crew members'),
('perm_crew_invoke', 'crew:invoke', 'crew', 'Invoke crew member actions'),

-- Code permissions
('perm_code_read', 'code:read', 'code', 'Read code files'),
('perm_code_write', 'code:write', 'code', 'Edit code files'),
('perm_code_execute', 'code:execute', 'code', 'Execute code and commands')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- TABLE: project_members
-- Purpose: User-project associations with roles
-- =====================================================
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES roles(id),
  invited_by UUID REFERENCES auth_profiles(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique membership per user per project
  UNIQUE(project_id, user_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);
CREATE INDEX idx_project_members_role ON project_members(role_id);

-- =====================================================
-- TABLE: audit_log
-- Purpose: Track all permission checks and actions
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth_profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  permission_checked TEXT,
  allowed BOOLEAN NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_log_allowed ON audit_log(allowed);

-- =====================================================
-- TABLE: api_keys
-- Purpose: API key authentication for VSCode extension
-- =====================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL, -- First 8 chars for identification
  name TEXT NOT NULL,
  scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

-- Indexes for API key lookups
CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);

-- =====================================================
-- TABLE: sessions
-- Purpose: Web dashboard session tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  ip_address INET,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for session lookups
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE auth_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS: auth_profiles
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON auth_profiles FOR SELECT
  USING (auth.uid() = id);

-- Administrators can view all profiles
CREATE POLICY "Administrators can view all profiles"
  ON auth_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth_profiles
      WHERE id = auth.uid() AND system_role = 'administrator'
    )
  );

-- Users can update their own display name
CREATE POLICY "Users can update own display name"
  ON auth_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Administrators can manage all profiles
CREATE POLICY "Administrators can manage profiles"
  ON auth_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth_profiles
      WHERE id = auth.uid() AND system_role = 'administrator'
    )
  );

-- =====================================================
-- RLS: projects
-- =====================================================

-- Users can view projects they have access to
CREATE POLICY "Users can view accessible projects"
  ON projects FOR SELECT
  USING (
    -- Project owner
    owner_id = auth.uid()
    OR
    -- Project member
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
        AND project_members.user_id = auth.uid()
    )
    OR
    -- Administrator
    EXISTS (
      SELECT 1 FROM auth_profiles
      WHERE auth_profiles.id = auth.uid()
        AND auth_profiles.system_role = 'administrator'
    )
  );

-- Project owners can update their projects
CREATE POLICY "Owners can update projects"
  ON projects FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Users with project:create permission can create projects
CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth_profiles ap
      JOIN roles r ON ap.system_role = r.id
      WHERE ap.id = auth.uid()
        AND r.capabilities @> '["project:create"]'::jsonb
    )
  );

-- Administrators can delete any project
CREATE POLICY "Administrators can delete projects"
  ON projects FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth_profiles
      WHERE id = auth.uid() AND system_role = 'administrator'
    )
  );

-- =====================================================
-- RLS: roles and permissions (read-only for all authenticated users)
-- =====================================================

CREATE POLICY "Authenticated users can view roles"
  ON roles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view permissions"
  ON permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- =====================================================
-- RLS: project_members
-- =====================================================

-- Users can view memberships for projects they have access to
CREATE POLICY "Users can view project memberships"
  ON project_members FOR SELECT
  USING (
    -- Own membership
    user_id = auth.uid()
    OR
    -- Member of the same project
    EXISTS (
      SELECT 1 FROM project_members pm2
      WHERE pm2.project_id = project_members.project_id
        AND pm2.user_id = auth.uid()
    )
    OR
    -- Administrator
    EXISTS (
      SELECT 1 FROM auth_profiles
      WHERE id = auth.uid() AND system_role = 'administrator'
    )
  );

-- Project owners can add members
CREATE POLICY "Owners can add members"
  ON project_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_members.project_id
        AND p.owner_id = auth.uid()
    )
  );

-- Project owners can update member roles
CREATE POLICY "Owners can update member roles"
  ON project_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_members.project_id
        AND p.owner_id = auth.uid()
    )
  );

-- Users can remove themselves, owners can remove any member
CREATE POLICY "Users can leave, owners can remove members"
  ON project_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_members.project_id
        AND p.owner_id = auth.uid()
    )
  );

-- =====================================================
-- RLS: audit_log
-- =====================================================

-- Administrators can view all audit logs
CREATE POLICY "Administrators can view audit logs"
  ON audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth_profiles
      WHERE id = auth.uid() AND system_role = 'administrator'
    )
  );

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON audit_log FOR SELECT
  USING (user_id = auth.uid());

-- System can insert audit logs (service role)
CREATE POLICY "System can insert audit logs"
  ON audit_log FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- RLS: api_keys
-- =====================================================

-- Users can view their own API keys
CREATE POLICY "Users can view own API keys"
  ON api_keys FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own API keys
CREATE POLICY "Users can create own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can revoke their own API keys
CREATE POLICY "Users can revoke own API keys"
  ON api_keys FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Administrators can view all API keys
CREATE POLICY "Administrators can view all API keys"
  ON api_keys FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth_profiles
      WHERE id = auth.uid() AND system_role = 'administrator'
    )
  );

-- =====================================================
-- RLS: sessions
-- =====================================================

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
  ON sessions FOR SELECT
  USING (user_id = auth.uid());

-- System can manage sessions (service role)
CREATE POLICY "System can manage sessions"
  ON sessions FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auth_profiles
CREATE TRIGGER update_auth_profiles_updated_at
  BEFORE UPDATE ON auth_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for projects
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PERMISSION CHECK FUNCTION
-- Purpose: Check if user has permission for action
-- =====================================================

CREATE OR REPLACE FUNCTION check_permission(
  p_user_id UUID,
  p_permission TEXT,
  p_project_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN := FALSE;
  v_system_role TEXT;
  v_project_role TEXT;
BEGIN
  -- Get user's system role
  SELECT system_role INTO v_system_role
  FROM auth_profiles
  WHERE id = p_user_id;

  -- If no user found, deny
  IF v_system_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check system role permissions
  SELECT EXISTS (
    SELECT 1 FROM roles
    WHERE id = v_system_role
      AND capabilities @> jsonb_build_array(p_permission)
  ) INTO v_has_permission;

  -- If permission granted by system role, return true
  IF v_has_permission THEN
    RETURN TRUE;
  END IF;

  -- If project_id provided, check project-specific role
  IF p_project_id IS NOT NULL THEN
    SELECT pm.role_id INTO v_project_role
    FROM project_members pm
    WHERE pm.project_id = p_project_id
      AND pm.user_id = p_user_id;

    IF v_project_role IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1 FROM roles
        WHERE id = v_project_role
          AND capabilities @> jsonb_build_array(p_permission)
      ) INTO v_has_permission;
    END IF;
  END IF;

  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- AUDIT LOGGING FUNCTION
-- Purpose: Log permission checks and actions
-- =====================================================

CREATE OR REPLACE FUNCTION log_audit(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT,
  p_permission_checked TEXT,
  p_allowed BOOLEAN,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_log (
    user_id,
    action,
    resource_type,
    resource_id,
    permission_checked,
    allowed,
    metadata
  ) VALUES (
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_permission_checked,
    p_allowed,
    p_metadata
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
