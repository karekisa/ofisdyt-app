import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export type Profile = {
  id: string
  full_name: string | null
  clinic_name: string | null
  public_slug: string | null
  work_start_hour: number | null
  work_end_hour: number | null
  session_duration: number | null
  created_at: string
}

export type Client = {
  id: string
  dietitian_id: string
  name: string
  phone: string | null
  age: number | null
  height: number | null
  gender: string | null
  notes: string | null
  created_at: string
}

export type Appointment = {
  id: string
  dietitian_id: string
  client_id: string | null
  guest_name: string | null
  guest_phone: string | null
  start_time: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  created_at: string
}

export type Measurement = {
  id: string
  client_id: string
  date: string
  weight: number | null
  body_fat_ratio: number | null
  created_at: string
}

