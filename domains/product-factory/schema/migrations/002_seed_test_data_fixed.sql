-- =====================================================
-- Alex AI RBAC Test Data (Fixed)
-- Version: 1.0.1
-- Date: 2025-12-26
-- Description: Seed test users and projects
-- =====================================================

-- =====================================================
-- Seed Test Users
-- =====================================================

-- Insert test users with fixed UUIDs
INSERT INTO auth_profiles (id, email, display_name, system_role) VALUES
-- Test Case 1: Administrator with full access
('00000000-0000-0000-0000-000000000001', 'admin@alex-ai.dev', 'Admin User', 'administrator'),

-- Test Case 2: User with minimal access (no projects)
('00000000-0000-0000-0000-000000000002', 'minimal@example.com', 'Minimal User', 'viewer'),

-- Test Case 3: Alice - Owner of ecommerce-platform
('00000000-0000-0000-0000-000000000003', 'alice@example.com', 'Alice (Owner)', 'owner'),

-- Test Case 4: Bob - Owner of blog-cms and mobile-backend
('00000000-0000-0000-0000-000000000004', 'bob@example.com', 'Bob (Multi-Owner)', 'owner'),

-- Test Case 5: Charlie - Developer on ecommerce-platform
('00000000-0000-0000-0000-000000000005', 'charlie@example.com', 'Charlie (Developer)', 'developer'),

-- Test Case 6: Diana - Developer on multiple projects
('00000000-0000-0000-0000-000000000006', 'diana@example.com', 'Diana (Multi-Dev)', 'developer'),

-- Test Case 7: Eve - Viewer on ecommerce-platform
('00000000-0000-0000-0000-000000000007', 'eve@example.com', 'Eve (Viewer)', 'viewer'),

-- Additional test users
('00000000-0000-0000-0000-000000000008', 'dev1@example.com', 'Dev User 1', 'developer'),
('00000000-0000-0000-0000-000000000009', 'viewer1@example.com', 'Viewer User 1', 'viewer')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Seed Test Projects
-- =====================================================

INSERT INTO projects (id, name, tagline, description, owner_id, category_slug, status) VALUES
(
  'ecommerce-platform',
  'E-Commerce Platform',
  'Modern e-commerce solution',
  'Full-stack e-commerce platform with React frontend and Node.js backend',
  '00000000-0000-0000-0000-000000000003', -- Alice
  'web-app',
  'active'
),
(
  'blog-cms',
  'Blog CMS',
  'Content management system for blogs',
  'Headless CMS built with Next.js and Supabase',
  '00000000-0000-0000-0000-000000000004', -- Bob
  'content',
  'active'
),
(
  'mobile-backend',
  'Mobile App Backend',
  'API backend for mobile applications',
  'REST API with GraphQL support for mobile apps',
  '00000000-0000-0000-0000-000000000004', -- Bob
  'api',
  'active'
),
(
  'internal-tool',
  'Internal Dashboard',
  'Company internal analytics dashboard',
  'Real-time analytics and monitoring dashboard',
  '00000000-0000-0000-0000-000000000001', -- Admin
  'dashboard',
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Seed Project Memberships
-- =====================================================

INSERT INTO project_members (project_id, user_id, role_id, invited_by, joined_at) VALUES
-- ecommerce-platform team
(
  'ecommerce-platform',
  '00000000-0000-0000-0000-000000000005', -- Charlie
  'developer',
  '00000000-0000-0000-0000-000000000003', -- invited by Alice
  NOW()
),
(
  'ecommerce-platform',
  '00000000-0000-0000-0000-000000000006', -- Diana
  'developer',
  '00000000-0000-0000-0000-000000000003', -- invited by Alice
  NOW()
),
(
  'ecommerce-platform',
  '00000000-0000-0000-0000-000000000007', -- Eve
  'viewer',
  '00000000-0000-0000-0000-000000000003', -- invited by Alice
  NOW()
),

-- blog-cms team
(
  'blog-cms',
  '00000000-0000-0000-0000-000000000006', -- Diana
  'developer',
  '00000000-0000-0000-0000-000000000004', -- invited by Bob
  NOW()
),

-- mobile-backend team
(
  'mobile-backend',
  '00000000-0000-0000-0000-000000000006', -- Diana
  'developer',
  '00000000-0000-0000-0000-000000000004', -- invited by Bob
  NOW()
),
(
  'mobile-backend',
  '00000000-0000-0000-0000-000000000008', -- dev1
  'developer',
  '00000000-0000-0000-0000-000000000004', -- invited by Bob
  NOW()
),

-- internal-tool team (admin project)
(
  'internal-tool',
  '00000000-0000-0000-0000-000000000003', -- Alice
  'owner',
  '00000000-0000-0000-0000-000000000001', -- invited by Admin
  NOW()
),
(
  'internal-tool',
  '00000000-0000-0000-0000-000000000004', -- Bob
  'owner',
  '00000000-0000-0000-0000-000000000001', -- invited by Admin
  NOW()
)
ON CONFLICT (project_id, user_id) DO NOTHING;

-- =====================================================
-- Sample Audit Logs
-- =====================================================

INSERT INTO audit_log (user_id, action, resource_type, resource_id, permission_checked, granted, metadata) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'create_project',
  'project',
  'internal-tool',
  'project:create',
  true,
  '{"project_name": "Internal Dashboard"}'::jsonb
),
(
  '00000000-0000-0000-0000-000000000003',
  'create_project',
  'project',
  'ecommerce-platform',
  'project:create',
  true,
  '{"project_name": "E-Commerce Platform"}'::jsonb
),
(
  '00000000-0000-0000-0000-000000000005',
  'access_project',
  'project',
  'ecommerce-platform',
  'project:read',
  true,
  '{"access_type": "read"}'::jsonb
),
(
  '00000000-0000-0000-0000-000000000002',
  'access_project',
  'project',
  'ecommerce-platform',
  'project:read',
  false,
  '{"access_type": "read", "reason": "not_member"}'::jsonb
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- Verification Queries
-- =====================================================

-- Display summary
DO $$
DECLARE
  user_count INTEGER;
  project_count INTEGER;
  membership_count INTEGER;
  role_count INTEGER;
  permission_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth_profiles;
  SELECT COUNT(*) INTO project_count FROM projects;
  SELECT COUNT(*) INTO membership_count FROM project_members;
  SELECT COUNT(*) INTO role_count FROM roles;
  SELECT COUNT(*) INTO permission_count FROM permissions;

  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Alex AI RBAC - Seed Data Summary';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Users created: %', user_count;
  RAISE NOTICE 'Projects created: %', project_count;
  RAISE NOTICE 'Memberships created: %', membership_count;
  RAISE NOTICE 'Roles defined: %', role_count;
  RAISE NOTICE 'Permissions defined: %', permission_count;
  RAISE NOTICE '===========================================';
END $$;
