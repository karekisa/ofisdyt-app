-- Migration: Add diet_templates table
-- Run this SQL in your Supabase SQL Editor if you already have the database

-- Diet Templates table (reusable templates for dietitians)
CREATE TABLE IF NOT EXISTS diet_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dietitian_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_diet_templates_dietitian_id ON diet_templates(dietitian_id);

-- Enable RLS
ALTER TABLE diet_templates ENABLE ROW LEVEL SECURITY;

-- Diet Templates policies
CREATE POLICY "Dietitians can view their own diet templates"
  ON diet_templates FOR SELECT
  USING (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can insert their own diet templates"
  ON diet_templates FOR INSERT
  WITH CHECK (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can update their own diet templates"
  ON diet_templates FOR UPDATE
  USING (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can delete their own diet templates"
  ON diet_templates FOR DELETE
  USING (auth.uid() = dietitian_id);


