-- =====================================================
-- Alex AI RBAC Test Data Seed
-- Version: 1.0.0
-- Date: 2025-12-26
-- Description: Mock users, projects, and memberships for testing
-- =====================================================

-- NOTE: In production, users would be created via Supabase Auth
-- This seed script assumes test users are already in auth.users
-- or you're using Supabase local development with test users

-- =====================================================
-- TEST USERS (auth_profiles)
-- =====================================================

-- Insert test user profiles
-- NOTE: UUIDs must match actual auth.users records in your Supabase instance
-- For local development, these can be created via Supabase Auth UI or API

INSERT INTO auth_profiles (id, email, display_name, system_role) VALUES
-- Control Case 1: Absolute Access (Administrator)
('00000000-0000-0000-0000-000000000001', 'admin@alex-ai.dev', 'Administrator', 'administrator'),

-- Control Case 2: Absolute Minimal Access (Viewer with no projects)
('00000000-0000-0000-0000-000000000002', 'minimal@example.com', 'Minimal User', 'viewer'),

-- Control Case 3: Project Owner (multiple projects)
('00000000-0000-0000-0000-000000000003', 'owner1@example.com', 'Alice Owner', 'owner'),
('00000000-0000-0000-0000-000000000004', 'owner2@example.com', 'Bob Owner', 'owner'),

-- Control Case 4: Developer (single project)
('00000000-0000-0000-0000-000000000005', 'dev1@example.com', 'Charlie Developer', 'developer'),

-- Control Case 5: Developer (multiple projects)
('00000000-0000-0000-0000-000000000006', 'superdev@example.com', 'Diana Super Dev', 'developer'),

-- Control Case 6: Viewer (read-only access)
('00000000-0000-0000-0000-000000000007', 'viewer1@example.com', 'Eve Viewer', 'viewer'),

-- Additional test users
('00000000-0000-0000-0000-000000000008', 'dev2@example.com', 'Frank Developer', 'developer'),
('00000000-0000-0000-0000-000000000009', 'viewer2@example.com', 'Grace Viewer', 'viewer')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  display_name = EXCLUDED.display_name,
  system_role = EXCLUDED.system_role,
  updated_at = NOW();

-- =====================================================
-- TEST PROJECTS
-- =====================================================

INSERT INTO projects (id, name, tagline, description, owner_id, category_slug, status) VALUES
-- Project 1: E-commerce Platform (owned by Alice)
(
  'ecommerce-platform',
  'E-commerce Platform',
  'Modern online store with DDD architecture',
  'Full-featured e-commerce platform built with Next.js, Domain-Driven Design, and AI-powered recommendations. Bounded contexts: product catalog, shopping cart, checkout, user management.',
  '00000000-0000-0000-0000-000000000003', -- Alice Owner
  'ddd-web-architecture',
  'active'
),

-- Project 2: Blog CMS (owned by Bob)
(
  'blog-cms',
  'Blog CMS',
  'Content management system with AI writing assistant',
  'WordPress-replacement blog platform with semantic content graph, AI-powered writing suggestions, and sitemap visualization. Bounded contexts: content, publishing, analytics, SEO.',
  '00000000-0000-0000-0000-000000000004', -- Bob Owner
  'ddd-web-architecture',
  'active'
),

-- Project 3: Mobile App Backend (owned by Bob)
(
  'mobile-backend',
  'Mobile App Backend',
  'GraphQL API for mobile applications',
  'Scalable GraphQL backend for iOS and Android apps. Bounded contexts: authentication, notifications, data sync, analytics.',
  '00000000-0000-0000-0000-000000000004', -- Bob Owner
  'enterprise-rag-platform-foundation',
  'active'
),

-- Project 4: Internal Tools (owned by Alice)
(
  'internal-tools',
  'Internal Tools',
  'Employee productivity dashboard',
  'Internal tooling for team collaboration, time tracking, and project management. Bounded contexts: workspace, tasks, reporting, integrations.',
  '00000000-0000-0000-0000-000000000003', -- Alice Owner
  'ai-platform-engineering-blueprint',
  'active'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  owner_id = EXCLUDED.owner_id,
  category_slug = EXCLUDED.category_slug,
  status = EXCLUDED.status,
  updated_at = NOW();

-- =====================================================
-- PROJECT MEMBERSHIPS
-- =====================================================

INSERT INTO project_members (project_id, user_id, role_id, invited_by) VALUES
-- E-commerce Platform memberships
('ecommerce-platform', '00000000-0000-0000-0000-000000000003', 'owner', NULL), -- Alice is owner
('ecommerce-platform', '00000000-0000-0000-0000-000000000005', 'developer', '00000000-0000-0000-0000-000000000003'), -- Charlie as developer
('ecommerce-platform', '00000000-0000-0000-0000-000000000006', 'developer', '00000000-0000-0000-0000-000000000003'), -- Diana as developer
('ecommerce-platform', '00000000-0000-0000-0000-000000000007', 'viewer', '00000000-0000-0000-0000-000000000003'), -- Eve as viewer

-- Blog CMS memberships
('blog-cms', '00000000-0000-0000-0000-000000000004', 'owner', NULL), -- Bob is owner
('blog-cms', '00000000-0000-0000-0000-000000000006', 'developer', '00000000-0000-0000-0000-000000000004'), -- Diana as developer
('blog-cms', '00000000-0000-0000-0000-000000000008', 'developer', '00000000-0000-0000-0000-000000000004'), -- Frank as developer
('blog-cms', '00000000-0000-0000-0000-000000000009', 'viewer', '00000000-0000-0000-0000-000000000004'), -- Grace as viewer

-- Mobile Backend memberships
('mobile-backend', '00000000-0000-0000-0000-000000000004', 'owner', NULL), -- Bob is owner
('mobile-backend', '00000000-0000-0000-0000-000000000006', 'developer', '00000000-0000-0000-0000-000000000004'), -- Diana as developer

-- Internal Tools memberships
('internal-tools', '00000000-0000-0000-0000-000000000003', 'owner', NULL), -- Alice is owner
('internal-tools', '00000000-0000-0000-0000-000000000008', 'developer', '00000000-0000-0000-0000-000000000003') -- Frank as developer

ON CONFLICT (project_id, user_id) DO UPDATE SET
  role_id = EXCLUDED.role_id,
  invited_by = EXCLUDED.invited_by;

-- =====================================================
-- API KEYS (for VSCode extension testing)
-- =====================================================

-- NOTE: In production, key_hash would be bcrypt/argon2 hash of actual API key
-- For testing, using placeholder hashes. Actual keys would be generated via API.

INSERT INTO api_keys (user_id, key_hash, key_prefix, name, scopes) VALUES
-- Administrator API key
(
  '00000000-0000-0000-0000-000000000001',
  'hash_admin_key_placeholder',
  'alex_adm',
  'Admin VSCode Key',
  '["system:manage_users", "project:create", "code:write"]'::jsonb
),

-- Charlie's developer API key
(
  '00000000-0000-0000-0000-000000000005',
  'hash_charlie_key_placeholder',
  'alex_cha',
  'Charlie VSCode Key',
  '["code:read", "code:write", "crew:chat"]'::jsonb
),

-- Diana's developer API key (multi-project)
(
  '00000000-0000-0000-0000-000000000006',
  'hash_diana_key_placeholder',
  'alex_dia',
  'Diana VSCode Key',
  '["code:read", "code:write", "crew:invoke"]'::jsonb
),

-- Eve's viewer API key (read-only)
(
  '00000000-0000-0000-0000-000000000007',
  'hash_eve_key_placeholder',
  'alex_eve',
  'Eve VSCode Key (Read Only)',
  '["code:read", "crew:chat"]'::jsonb
)
ON CONFLICT (key_hash) DO NOTHING;

-- =====================================================
-- SAMPLE AUDIT LOG ENTRIES
-- =====================================================

-- Insert sample audit logs to demonstrate logging
INSERT INTO audit_log (user_id, action, resource_type, resource_id, permission_checked, allowed, metadata) VALUES
-- Successful actions
(
  '00000000-0000-0000-0000-000000000001',
  'create_project',
  'project',
  'ecommerce-platform',
  'project:create',
  TRUE,
  '{"ip": "192.168.1.100", "user_agent": "VSCode Extension 1.0.0"}'::jsonb
),
(
  '00000000-0000-0000-0000-000000000005',
  'write_file',
  'file',
  'src/domain/product/Product.ts',
  'code:write',
  TRUE,
  '{"project_id": "ecommerce-platform", "file_size": 1024}'::jsonb
),
(
  '00000000-0000-0000-0000-000000000007',
  'read_file',
  'file',
  'src/domain/cart/Cart.ts',
  'code:read',
  TRUE,
  '{"project_id": "ecommerce-platform"}'::jsonb
),

-- Denied actions (permission checks that failed)
(
  '00000000-0000-0000-0000-000000000007',
  'write_file',
  'file',
  'src/domain/cart/Cart.ts',
  'code:write',
  FALSE,
  '{"project_id": "ecommerce-platform", "reason": "Viewer role cannot write code"}'::jsonb
),
(
  '00000000-0000-0000-0000-000000000002',
  'read_project',
  'project',
  'ecommerce-platform',
  'project:read',
  FALSE,
  '{"reason": "User has no membership in project"}'::jsonb
),
(
  '00000000-0000-0000-0000-000000000005',
  'delete_project',
  'project',
  'ecommerce-platform',
  'project:delete',
  FALSE,
  '{"reason": "Developer role cannot delete projects"}'::jsonb
);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- You can run these queries to verify the seed data:

-- 1. View all users and their system roles
-- SELECT id, email, display_name, system_role FROM auth_profiles ORDER BY system_role, email;

-- 2. View all projects and their owners
-- SELECT p.id, p.name, p.owner_id, ap.email as owner_email
-- FROM projects p
-- JOIN auth_profiles ap ON p.owner_id = ap.id
-- ORDER BY p.name;

-- 3. View project memberships
-- SELECT
--   pm.project_id,
--   p.name as project_name,
--   ap.email as user_email,
--   pm.role_id,
--   ap2.email as invited_by_email
-- FROM project_members pm
-- JOIN projects p ON pm.project_id = p.id
-- JOIN auth_profiles ap ON pm.user_id = ap.id
-- LEFT JOIN auth_profiles ap2 ON pm.invited_by = ap2.id
-- ORDER BY pm.project_id, pm.role_id;

-- 4. Test permission check function
-- SELECT check_permission(
--   '00000000-0000-0000-0000-000000000001'::uuid, -- admin user
--   'system:manage_users',
--   NULL
-- ); -- Should return TRUE

-- SELECT check_permission(
--   '00000000-0000-0000-0000-000000000005'::uuid, -- Charlie (developer)
--   'code:write',
--   'ecommerce-platform'
-- ); -- Should return TRUE

-- SELECT check_permission(
--   '00000000-0000-0000-0000-000000000007'::uuid, -- Eve (viewer)
--   'code:write',
--   'ecommerce-platform'
-- ); -- Should return FALSE

-- 5. View audit log summary
-- SELECT
--   action,
--   permission_checked,
--   allowed,
--   COUNT(*) as count
-- FROM audit_log
-- GROUP BY action, permission_checked, allowed
-- ORDER BY action, allowed DESC;

-- =====================================================
-- TEST CASE REFERENCE
-- =====================================================

/*
TEST CASE 1: Absolute Access (Administrator)
- User: admin@alex-ai.dev (ID: 00000000-0000-0000-0000-000000000001)
- System Role: administrator
- Expected: ✅ All permissions granted
- Can: Manage users, create/delete projects, view audit logs, write code, invoke crew

TEST CASE 2: Absolute Minimal Access (Viewer with no projects)
- User: minimal@example.com (ID: 00000000-0000-0000-0000-000000000002)
- System Role: viewer
- Project Memberships: NONE
- Expected: ❌ Cannot access any projects, ✅ Can only chat with crew (system-level permission)

TEST CASE 3: Project Owner (Multi-Project)
- User: owner2@example.com (Bob) (ID: 00000000-0000-0000-0000-000000000004)
- System Role: owner
- Owns: blog-cms, mobile-backend
- Expected:
  ✅ Full access to blog-cms and mobile-backend
  ✅ Can invite members, manage roles, write code
  ❌ Cannot access ecommerce-platform (not a member)
  ❌ Cannot manage system users (not administrator)

TEST CASE 4: Developer (Single Project)
- User: dev1@example.com (Charlie) (ID: 00000000-0000-0000-0000-000000000005)
- System Role: developer
- Member of: ecommerce-platform (developer role)
- Expected:
  ✅ Can read/write code in ecommerce-platform
  ✅ Can invoke crew members
  ❌ Cannot invite new members
  ❌ Cannot delete project
  ❌ Cannot access other projects

TEST CASE 5: Developer (Multi-Project)
- User: superdev@example.com (Diana) (ID: 00000000-0000-0000-0000-000000000006)
- System Role: developer
- Member of: ecommerce-platform (developer), blog-cms (developer), mobile-backend (developer)
- Expected:
  ✅ Can write code in all 3 projects
  ✅ Can switch between projects in VSCode extension
  ❌ Cannot manage project settings
  ❌ Cannot access internal-tools (not a member)

TEST CASE 6: Viewer (Read-Only)
- User: viewer1@example.com (Eve) (ID: 00000000-0000-0000-0000-000000000007)
- System Role: viewer
- Member of: ecommerce-platform (viewer role)
- Expected:
  ✅ Can read code in ecommerce-platform
  ✅ Can chat with crew
  ❌ Cannot write/execute code
  ❌ Cannot modify project settings
  ❌ Cannot access other projects
*/

-- =====================================================
-- END OF SEED DATA
-- =====================================================
