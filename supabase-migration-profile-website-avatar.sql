-- Add website and avatar_url fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;






