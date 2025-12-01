-- Migration: Add diet_lists table
-- Run this SQL in your Supabase SQL Editor if you already have the database

-- Diet Lists table
CREATE TABLE IF NOT EXISTS diet_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dietitian_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_diet_lists_client_id ON diet_lists(client_id);
CREATE INDEX IF NOT EXISTS idx_diet_lists_dietitian_id ON diet_lists(dietitian_id);

-- Enable RLS
ALTER TABLE diet_lists ENABLE ROW LEVEL SECURITY;

-- Diet Lists policies
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

