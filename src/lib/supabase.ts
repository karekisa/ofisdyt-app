import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Re-export types from types.ts for backward compatibility
// All types are now centralized in @/lib/types.ts
export type {
  Profile,
  Client,
  Appointment,
  Measurement,
  Transaction,
  TransactionType,
  AppointmentStatus,
  PaymentMethod,
  Profession,
  SubscriptionStatus,
} from './types'

