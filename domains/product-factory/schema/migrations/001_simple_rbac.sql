-- =====================================================
-- Alex AI RBAC Schema - Simplified Migration
-- No RLS policies during setup - we'll add them later
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS auth_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  system_role TEXT NOT NULL DEFAULT 'developer' CHECK (system_role IN ('administrator', 'owner', 'developer', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_profiles_email ON auth_profiles(email);

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

CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  hierarchy_level INTEGER NOT NULL UNIQUE CHECK (hierarchy_level >= 0 AND hierarchy_level <= 100),
  description TEXT,
  capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roles_hierarchy ON roles(hierarchy_level);

CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('system', 'project', 'crew', 'code')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);

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

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id);

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

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_active_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- =====================================================
-- SEED ROLES
-- =====================================================

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
-- SEED PERMISSIONS
-- =====================================================

INSERT INTO permissions (id, name, category, description) VALUES
('perm_system_manage_users', 'system:manage_users', 'system', 'Create, update, delete users'),
('perm_system_manage_roles', 'system:manage_roles', 'system', 'Modify role definitions and assignments'),
('perm_system_view_audit', 'system:view_audit_logs', 'system', 'View system-wide audit logs'),
('perm_system_configure', 'system:configure', 'system', 'Modify system configuration'),
('perm_project_create', 'project:create', 'project', 'Create new projects'),
('perm_project_read', 'project:read', 'project', 'View project details'),
('perm_project_write', 'project:write', 'project', 'Update project details'),
('perm_project_delete', 'project:delete', 'project', 'Permanently delete projects'),
('perm_project_configure', 'project:configure', 'project', 'Configure project settings'),
('perm_project_invite', 'project:invite_members', 'project', 'Invite users to project'),
('perm_project_manage', 'project:manage_members', 'project', 'Manage project team members'),
('perm_crew_chat', 'crew:chat', 'crew', 'Chat with AI crew members'),
('perm_crew_invoke', 'crew:invoke', 'crew', 'Invoke crew workflows'),
('perm_code_read', 'code:read', 'code', 'Read code and documentation'),
('perm_code_write', 'code:write', 'code', 'Write and modify code'),
('perm_code_execute', 'code:execute', 'code', 'Execute code and scripts')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- RPC FUNCTIONS
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

  -- Check if user is project owner
  IF EXISTS (
    SELECT 1 FROM projects
    WHERE id = p_project_id
    AND owner_id = p_user_id
  ) THEN
    SELECT EXISTS (
      SELECT 1
      FROM roles
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
  AND pm.joined_at IS NOT NULL;

  IF v_project_role IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM roles
      WHERE id = v_project_role
      AND capabilities ? p_permission
    ) INTO v_has_capability;
    RETURN v_has_capability;
  END IF;

  RETURN FALSE;
END;
$$;

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

-- =====================================================
-- SEED TEST USERS
-- =====================================================

INSERT INTO auth_profiles (id, email, display_name, system_role) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@alex-ai.dev', 'Admin User', 'administrator'),
('00000000-0000-0000-0000-000000000002', 'minimal@example.com', 'Minimal User', 'viewer'),
('00000000-0000-0000-0000-000000000003', 'alice@example.com', 'Alice (Owner)', 'owner'),
('00000000-0000-0000-0000-000000000004', 'bob@example.com', 'Bob (Multi-Owner)', 'owner'),
('00000000-0000-0000-0000-000000000005', 'charlie@example.com', 'Charlie (Developer)', 'developer'),
('00000000-0000-0000-0000-000000000006', 'diana@example.com', 'Diana (Multi-Dev)', 'developer'),
('00000000-0000-0000-0000-000000000007', 'eve@example.com', 'Eve (Viewer)', 'viewer'),
('00000000-0000-0000-0000-000000000008', 'dev1@example.com', 'Dev User 1', 'developer'),
('00000000-0000-0000-0000-000000000009', 'viewer1@example.com', 'Viewer User 1', 'viewer')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SEED TEST PROJECTS
-- =====================================================

INSERT INTO projects (id, name, tagline, description, owner_id, category_slug, status) VALUES
('ecommerce-platform', 'E-Commerce Platform', 'Modern e-commerce solution',
  'Full-stack e-commerce platform with React frontend and Node.js backend',
  '00000000-0000-0000-0000-000000000003', 'web-app', 'active'),
('blog-cms', 'Blog CMS', 'Content management system for blogs',
  'Headless CMS built with Next.js and Supabase',
  '00000000-0000-0000-0000-000000000004', 'content', 'active'),
('mobile-backend', 'Mobile App Backend', 'API backend for mobile applications',
  'REST API with GraphQL support for mobile apps',
  '00000000-0000-0000-0000-000000000004', 'api', 'active'),
('internal-tool', 'Internal Dashboard', 'Company internal analytics dashboard',
  'Real-time analytics and monitoring dashboard',
  '00000000-0000-0000-0000-000000000001', 'dashboard', 'active')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SEED PROJECT MEMBERSHIPS
-- =====================================================

INSERT INTO project_members (project_id, user_id, role_id, invited_by, joined_at) VALUES
('ecommerce-platform', '00000000-0000-0000-0000-000000000005', 'developer', '00000000-0000-0000-0000-000000000003', NOW()),
('ecommerce-platform', '00000000-0000-0000-0000-000000000006', 'developer', '00000000-0000-0000-0000-000000000003', NOW()),
('ecommerce-platform', '00000000-0000-0000-0000-000000000007', 'viewer', '00000000-0000-0000-0000-000000000003', NOW()),
('blog-cms', '00000000-0000-0000-0000-000000000006', 'developer', '00000000-0000-0000-0000-000000000004', NOW()),
('mobile-backend', '00000000-0000-0000-0000-000000000006', 'developer', '00000000-0000-0000-0000-000000000004', NOW()),
('mobile-backend', '00000000-0000-0000-0000-000000000008', 'developer', '00000000-0000-0000-0000-000000000004', NOW()),
('internal-tool', '00000000-0000-0000-0000-000000000003', 'owner', '00000000-0000-0000-0000-000000000001', NOW()),
('internal-tool', '00000000-0000-0000-0000-000000000004', 'owner', '00000000-0000-0000-0000-000000000001', NOW())
ON CONFLICT (project_id, user_id) DO NOTHING;

-- =====================================================
-- Success Message
-- =====================================================

DO $$
DECLARE
  user_count INTEGER;
  project_count INTEGER;
  membership_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth_profiles;
  SELECT COUNT(*) INTO project_count FROM projects;
  SELECT COUNT(*) INTO membership_count FROM project_members;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Alex AI RBAC Schema - Setup Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Users: %', user_count;
  RAISE NOTICE 'Projects: %', project_count;
  RAISE NOTICE 'Memberships: %', membership_count;
  RAISE NOTICE 'Roles: 4';
  RAISE NOTICE 'Permissions: 16';
  RAISE NOTICE '========================================';
END $$;
