-- Enhanced admin_users_view with activity tracking and counts
-- This view includes last_sign_in_at, client_count, and appointment_count

-- Drop existing view if it exists
DROP VIEW IF EXISTS admin_users_view;

-- Create enhanced view with activity data
CREATE VIEW admin_users_view AS
SELECT 
  p.id,
  p.full_name,
  p.clinic_name,
  p.phone,
  p.public_slug,
  p.is_admin,
  p.subscription_status,
  p.subscription_ends_at,
  p.trial_ends_at,
  p.created_at,
  u.email,
  u.last_sign_in_at,
  COALESCE(
    (SELECT COUNT(*) FROM clients c WHERE c.dietitian_id = p.id),
    0
  ) as client_count,
  COALESCE(
    (SELECT COUNT(*) FROM appointments a WHERE a.dietitian_id = p.id),
    0
  ) as appointment_count
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id;

-- Grant access to authenticated users (admins will see all via RLS)
GRANT SELECT ON admin_users_view TO authenticated;

-- Add comment
COMMENT ON VIEW admin_users_view IS 'Enhanced admin view with user activity and statistics';



