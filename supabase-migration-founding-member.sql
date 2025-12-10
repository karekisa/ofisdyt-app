-- Migration: Add is_founding_member column to profiles table
-- This allows admins to mark specific users as "Founding Members" (Kurucu Üye)

-- Add is_founding_member column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_founding_member BOOLEAN DEFAULT FALSE NOT NULL;

-- Update admin_users_view to include is_founding_member
DROP VIEW IF EXISTS admin_users_view;

CREATE VIEW admin_users_view AS
SELECT 
  p.id,
  p.full_name,
  p.clinic_name,
  p.phone,
  p.public_slug,
  p.is_admin,
  p.is_founding_member,
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
COMMENT ON VIEW admin_users_view IS 'Enhanced admin view with user activity, statistics, and founding member status';

-- Add comment to column
COMMENT ON COLUMN public.profiles.is_founding_member IS 'Indicates if the user is a founding member (Kurucu Üye)';

