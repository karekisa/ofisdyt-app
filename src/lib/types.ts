// --- ENUMS / UNION TYPES (Must be exported) ---

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';

export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 'cash' | 'credit_card' | 'eft' | 'other';

export type SubscriptionStatus = 'trial' | 'active' | 'expired';

export type Profession = 'dietitian' | 'psychologist' | 'pt' | 'consultant'; // Keeping for legacy support

export type SupportTicketStatus = 'pending' | 'solved' | 'in_progress';

// --- MAIN INTERFACES ---

export interface Profile {
  id: string;
  full_name: string | null;
  clinic_name: string | null;
  phone: string | null;
  website: string | null;
  bio: string | null;
  avatar_url: string | null;
  public_slug: string | null;
  is_admin: boolean;
  subscription_status: SubscriptionStatus;
  subscription_ends_at: string | null;
  trial_ends_at: string | null;
  work_start_hour: string;
  work_end_hour: string;
  session_duration: number;
}

export interface Client {
  id: string;
  dietitian_id: string;
  name: string;
  phone: string | null;
  age: number | null;
  height: number | null;
  gender: string | null;
  notes: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  dietitian_id: string;
  client_id: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  guest_email: string | null;
  start_time: string;
  status: AppointmentStatus; // Using the exported type
  created_at: string;
  reminder_sent?: boolean;
  clients?: {
    name: string;
    phone: string | null;
  } | null;
}

export interface Measurement {
  id: string;
  client_id: string;
  weight: number;
  body_fat_ratio: number | null;
  muscle_ratio: number | null;
  water_ratio: number | null;
  date: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  created_at: string;
  description: string | null;
  amount: number;
  type: TransactionType; // Using the exported type
  category: string;
  transaction_date: string;
  payment_method?: string; // Can be string or PaymentMethod
  clients?: {
    name: string;
  } | null;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  title: string;
  message: string;
  status: SupportTicketStatus; // Using the exported type
  created_at: string;
  profiles?: {
    full_name: string | null;
    email?: string;
  } | null;
}

export interface DietList {
  id: string;
  client_id: string;
  dietitian_id: string;
  title: string;
  content: string;
  created_at: string;
}
