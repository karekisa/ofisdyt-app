-- Migration: Add category field to diet_templates table
-- Run this SQL in your Supabase SQL Editor

-- Add category column
ALTER TABLE diet_templates
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'daily' CHECK (category IN ('daily', 'weekly'));

-- Update existing rows to have a default category
UPDATE diet_templates
SET category = 'daily'
WHERE category IS NULL;

-- Make category NOT NULL after updating existing rows
ALTER TABLE diet_templates
ALTER COLUMN category SET NOT NULL;

