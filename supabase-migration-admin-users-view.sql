-- Create a view for admin users that includes email from auth.users
-- This view joins profiles with auth.users to get email addresses
-- Note: Views inherit RLS from underlying tables, but we'll use a function for better control
CREATE OR REPLACE VIEW admin_users_view AS
SELECT 
  p.id,
  p.full_name,
  p.clinic_name,
  p.is_admin,
  p.subscription_status,
  p.subscription_ends_at,
  p.trial_ends_at,
  p.created_at,
  au.email
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id;

-- Note: RLS on views in Supabase works differently
-- The view will inherit RLS from the profiles table
-- Admins can see all profiles due to existing RLS policies

