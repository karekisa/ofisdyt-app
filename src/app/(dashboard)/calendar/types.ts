// Shared types for calendar components

export type Appointment = {
  id: string
  start_time: string
  status: string
  guest_name: string | null
  guest_phone: string | null
  client_id: string | null
  clients?: { name: string; phone: string | null } | null
}


