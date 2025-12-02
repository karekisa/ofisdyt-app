// Additional TypeScript types for the application

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          clinic_name: string | null
          phone: string | null
          bio: string | null
          website: string | null
          avatar_url: string | null
          public_slug: string | null
          work_start_hour: number | null
          work_end_hour: number | null
          session_duration: number | null
          is_admin: boolean | null
          subscription_status: 'active' | 'expired' | 'suspended' | null
          subscription_ends_at: string | null
          trial_ends_at: string | null
          profession: 'dietitian' | 'psychologist' | 'pt' | 'consultant' | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          clinic_name?: string | null
          phone?: string | null
          bio?: string | null
          website?: string | null
          avatar_url?: string | null
          public_slug?: string | null
          work_start_hour?: number | null
          work_end_hour?: number | null
          session_duration?: number | null
          is_admin?: boolean | null
          subscription_status?: 'active' | 'expired' | 'suspended' | null
          subscription_ends_at?: string | null
          trial_ends_at?: string | null
          profession?: 'dietitian' | 'psychologist' | 'pt' | 'consultant' | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          clinic_name?: string | null
          phone?: string | null
          bio?: string | null
          website?: string | null
          avatar_url?: string | null
          public_slug?: string | null
          work_start_hour?: number | null
          work_end_hour?: number | null
          session_duration?: number | null
          is_admin?: boolean | null
          subscription_status?: 'active' | 'expired' | 'suspended' | null
          subscription_ends_at?: string | null
          profession?: 'dietitian' | 'psychologist' | 'pt' | 'consultant' | null
        }
      }
      clients: {
        Row: {
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
        Insert: {
          id?: string
          dietitian_id: string
          name: string
          phone?: string | null
          age?: number | null
          height?: number | null
          gender?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          dietitian_id?: string
          name?: string
          phone?: string | null
          age?: number | null
          height?: number | null
          gender?: string | null
          notes?: string | null
        }
      }
      appointments: {
        Row: {
          id: string
          dietitian_id: string
          client_id: string | null
          guest_name: string | null
          guest_phone: string | null
          start_time: string
          status: 'pending' | 'approved' | 'rejected' | 'completed'
          created_at: string
        }
        Insert: {
          id?: string
          dietitian_id: string
          client_id?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          start_time: string
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
          created_at?: string
        }
        Update: {
          id?: string
          dietitian_id?: string
          client_id?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          start_time?: string
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
        }
      }
      measurements: {
        Row: {
          id: string
          client_id: string
          date: string
          weight: number | null
          body_fat_ratio: number | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          date: string
          weight?: number | null
          body_fat_ratio?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          date?: string
          weight?: number | null
          body_fat_ratio?: number | null
        }
      }
      transactions: {
        Row: {
          id: string
          dietitian_id: string
          type: 'income' | 'expense'
          amount: number
          category: string
          description: string | null
          payment_method: 'cash' | 'credit_card' | 'transfer'
          transaction_date: string
          client_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          dietitian_id: string
          type: 'income' | 'expense'
          amount: number
          category: string
          description?: string | null
          payment_method: 'cash' | 'credit_card' | 'transfer'
          transaction_date: string
          client_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          dietitian_id?: string
          type?: 'income' | 'expense'
          amount?: number
          category?: string
          description?: string | null
          payment_method?: 'cash' | 'credit_card' | 'transfer'
          transaction_date?: string
          client_id?: string | null
        }
      }
    }
  }
}

