-- Add profession field to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profession TEXT CHECK (profession IN ('dietitian', 'psychologist', 'pt', 'consultant'));

-- Create index for profession queries
CREATE INDEX IF NOT EXISTS idx_profiles_profession ON profiles(profession);




