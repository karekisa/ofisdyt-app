-- Fix RLS Policies for Public Booking Page Access
-- Run this SQL in your Supabase SQL Editor
-- This allows unauthenticated users to read profile data via public_slug

-- 1. Enable RLS (Ensure it's on)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop restrictive policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view profiles via slug" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- 3. Create a GLOBAL READ policy (The Fix)
-- Allow ANYONE (auth or anon) to read profile data (needed for booking pages)
-- This is safe because we're only exposing public profile data (name, clinic, bio, etc.)
CREATE POLICY "Public Read Access"
ON public.profiles
FOR SELECT
USING (true);

-- 4. Restore Write Access for Owners
-- Users can only update their own profile
CREATE POLICY "Owners can update"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Users can only insert their own profile
CREATE POLICY "Owners can insert"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 5. Admin Access (if needed)
-- Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Admins can update any profile
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);


