-- Create system_announcements table for global announcements
CREATE TABLE IF NOT EXISTS system_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create index for active announcements
CREATE INDEX IF NOT EXISTS idx_system_announcements_is_active ON system_announcements(is_active);

-- Enable RLS
ALTER TABLE system_announcements ENABLE ROW LEVEL SECURITY;

-- Only admins can view all announcements
CREATE POLICY "Admins can view all announcements"
  ON system_announcements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Everyone can view active announcements
CREATE POLICY "Everyone can view active announcements"
  ON system_announcements FOR SELECT
  USING (is_active = true);

-- Only admins can insert announcements
CREATE POLICY "Admins can insert announcements"
  ON system_announcements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Only admins can update announcements
CREATE POLICY "Admins can update announcements"
  ON system_announcements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Only admins can delete announcements
CREATE POLICY "Admins can delete announcements"
  ON system_announcements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );




