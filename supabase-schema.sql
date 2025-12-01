-- Dietitian Pro Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  clinic_name TEXT,
  phone TEXT,
  bio TEXT,
  website TEXT,
  avatar_url TEXT,
  public_slug TEXT UNIQUE,
  work_start_hour INTEGER DEFAULT 9,
  work_end_hour INTEGER DEFAULT 17,
  session_duration INTEGER DEFAULT 60,
  is_admin BOOLEAN DEFAULT FALSE,
  subscription_status TEXT DEFAULT 'expired' CHECK (subscription_status IN ('active', 'expired', 'suspended')),
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dietitian_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  age INTEGER,
  height DECIMAL(5,2),
  gender TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dietitian_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  guest_name TEXT,
  guest_phone TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Measurements table
CREATE TABLE IF NOT EXISTS measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight DECIMAL(5,2),
  body_fat_ratio DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Diet Lists table
CREATE TABLE IF NOT EXISTS diet_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dietitian_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Transactions table for Finance & Cash Flow tracking
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dietitian_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'credit_card', 'transfer')),
  transaction_date DATE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_dietitian_id ON clients(dietitian_id);
CREATE INDEX IF NOT EXISTS idx_appointments_dietitian_id ON appointments(dietitian_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_measurements_client_id ON measurements(client_id);
CREATE INDEX IF NOT EXISTS idx_diet_lists_client_id ON diet_lists(client_id);
CREATE INDEX IF NOT EXISTS idx_diet_lists_dietitian_id ON diet_lists(dietitian_id);
CREATE INDEX IF NOT EXISTS idx_profiles_public_slug ON profiles(public_slug);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_transactions_dietitian_id ON transactions(dietitian_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON transactions(client_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Public profiles can be viewed by anyone (for booking page)
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (public_slug IS NOT NULL);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Clients policies
CREATE POLICY "Dietitians can view their own clients"
  ON clients FOR SELECT
  USING (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can insert their own clients"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can update their own clients"
  ON clients FOR UPDATE
  USING (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can delete their own clients"
  ON clients FOR DELETE
  USING (auth.uid() = dietitian_id);

-- Appointments policies
CREATE POLICY "Dietitians can view their own appointments"
  ON appointments FOR SELECT
  USING (auth.uid() = dietitian_id);

CREATE POLICY "Anyone can insert appointments (for public booking)"
  ON appointments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Dietitians can update their own appointments"
  ON appointments FOR UPDATE
  USING (auth.uid() = dietitian_id);

-- Admins can view all appointments
CREATE POLICY "Admins can view all appointments"
  ON appointments FOR SELECT
  USING (
    auth.uid() = dietitian_id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Measurements policies
CREATE POLICY "Dietitians can view measurements of their clients"
  ON measurements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = measurements.client_id
      AND clients.dietitian_id = auth.uid()
    )
  );

CREATE POLICY "Dietitians can insert measurements for their clients"
  ON measurements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = measurements.client_id
      AND clients.dietitian_id = auth.uid()
    )
  );

CREATE POLICY "Dietitians can update measurements of their clients"
  ON measurements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = measurements.client_id
      AND clients.dietitian_id = auth.uid()
    )
  );

CREATE POLICY "Dietitians can delete measurements of their clients"
  ON measurements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = measurements.client_id
      AND clients.dietitian_id = auth.uid()
    )
  );

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

-- Transactions policies
CREATE POLICY "Dietitians can view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can insert their own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can update their own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can delete their own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = dietitian_id);

