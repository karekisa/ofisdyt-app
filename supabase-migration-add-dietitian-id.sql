-- Migration: Add dietitian_id column to existing diet_lists table
-- Run this SQL in your Supabase SQL Editor if you already have diet_lists table without dietitian_id

-- Add dietitian_id column
ALTER TABLE diet_lists
ADD COLUMN IF NOT EXISTS dietitian_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing rows (set dietitian_id from client relationship)
-- This assumes all existing diet lists belong to the client's dietitian
UPDATE diet_lists
SET dietitian_id = clients.dietitian_id
FROM clients
WHERE diet_lists.client_id = clients.id
AND diet_lists.dietitian_id IS NULL;

-- Make dietitian_id NOT NULL after updating existing rows
ALTER TABLE diet_lists
ALTER COLUMN dietitian_id SET NOT NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_diet_lists_dietitian_id ON diet_lists(dietitian_id);

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Dietitians can view diet lists of their clients" ON diet_lists;
DROP POLICY IF EXISTS "Dietitians can insert diet lists for their clients" ON diet_lists;
DROP POLICY IF EXISTS "Dietitians can update diet lists of their clients" ON diet_lists;
DROP POLICY IF EXISTS "Dietitians can delete diet lists of their clients" ON diet_lists;

-- Create new policies
CREATE POLICY "Dietitians can view their own diet lists"
  ON diet_lists FOR SELECT
  USING (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can insert their own diet lists"
  ON diet_lists FOR INSERT
  WITH CHECK (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can update their own diet lists"
  ON diet_lists FOR UPDATE
  USING (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can delete their own diet lists"
  ON diet_lists FOR DELETE
  USING (auth.uid() = dietitian_id);













