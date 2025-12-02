-- Migration: Add availability settings to profiles table
-- Run this SQL in your Supabase SQL Editor if you already have the profiles table

-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS work_start_hour INTEGER DEFAULT 9,
ADD COLUMN IF NOT EXISTS work_end_hour INTEGER DEFAULT 17,
ADD COLUMN IF NOT EXISTS session_duration INTEGER DEFAULT 60;

-- Update existing profiles with default values if they are NULL
UPDATE profiles
SET 
  work_start_hour = 9,
  work_end_hour = 17,
  session_duration = 60
WHERE work_start_hour IS NULL OR work_end_hour IS NULL OR session_duration IS NULL;







