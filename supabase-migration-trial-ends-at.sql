-- Add trial_ends_at field to profiles table for free trial tracking
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Set default trial_ends_at to 15 days from creation for new users
-- This will be handled in the application code, but we can also set a default
-- Note: We'll set it in the signup logic instead











