import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Convert text to URL-friendly slug
 * Handles Turkish characters and special cases
 * @param text - Text to convert to slug
 * @returns URL-friendly slug (lowercase, dashes, alphanumeric)
 * 
 * @example
 * slugify("Dr. Furkan Şahin") // "dr-furkan-sahin"
 * slugify("Dyt. Ayşe Özkan") // "dyt-ayse-ozkan"
 */
export function slugify(text: string | null | undefined): string {
  if (!text) return ''
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Turkish character replacements
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/İ/g, 'i')
    .replace(/Ş/g, 's')
    .replace(/Ğ/g, 'g')
    .replace(/Ü/g, 'u')
    .replace(/Ö/g, 'o')
    .replace(/Ç/g, 'c')
    // Remove special characters except spaces, dashes, underscores
    .replace(/[^a-z0-9\s_-]/g, '')
    // Replace spaces and multiple dashes/underscores with single dash
    .replace(/[\s_-]+/g, '-')
    // Remove leading/trailing dashes
    .replace(/^-+|-+$/g, '')
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get initials from a full name
 * @param name - Full name (e.g., "Ahmet Yılmaz" or "Dr. Ayşe Demir")
 * @returns Initials in uppercase (e.g., "AY" or "AD")
 */
export function getInitials(name: string | null | undefined): string {
  if (!name || name.trim().length === 0) {
    return '??'
  }

  const words = name.trim().split(/\s+/).filter(word => word.length > 0)
  
  if (words.length === 0) {
    return '??'
  }

  if (words.length === 1) {
    // Single word: take first two letters
    return words[0].substring(0, 2).toUpperCase()
  }

  // Multiple words: take first letter of first and last word
  const firstInitial = words[0].charAt(0).toUpperCase()
  const lastInitial = words[words.length - 1].charAt(0).toUpperCase()
  
  return `${firstInitial}${lastInitial}`
}

/**
 * Format phone number for WhatsApp API
 * WhatsApp requires format: Country Code + Number (e.g., 905321234567)
 *
 * @param phone - Phone number in any format (e.g., "0532 123 45 67", "+90 532...", "532...")
 * @returns Formatted phone number (e.g., "905321234567") or null if invalid
 */
export function formatPhoneForWhatsapp(phone: string | null | undefined): string | null {
  if (!phone) return null

  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '')

  // Check if we have enough digits (minimum 10 for Turkish numbers)
  if (digitsOnly.length < 10) {
    return null
  }

  let cleanNumber = digitsOnly

  // If starts with '0', remove it (e.g., 0532 -> 532)
  if (cleanNumber.startsWith('0')) {
    cleanNumber = cleanNumber.substring(1)
  }

  // If starts with '90', keep it as is
  if (cleanNumber.startsWith('90')) {
    // Ensure it's a valid Turkish number (should be 12 digits: 90 + 10 digits)
    if (cleanNumber.length === 12) {
      return cleanNumber
    }
    // If it's longer, might have extra digits, return null
    if (cleanNumber.length > 12) {
      return null
    }
  }

  // If starts with '5' and is 10 digits, prepend '90' (Turkish mobile number)
  if (cleanNumber.startsWith('5') && cleanNumber.length === 10) {
    return `90${cleanNumber}`
  }

  // If it's exactly 10 digits and doesn't start with 0, assume it's a Turkish number
  if (cleanNumber.length === 10 && !cleanNumber.startsWith('0')) {
    return `90${cleanNumber}`
  }

  // If it's 11 digits and starts with 5, might be missing country code
  if (cleanNumber.length === 11 && cleanNumber.startsWith('5')) {
    return `90${cleanNumber}`
  }

  // If we have 12 digits and it doesn't start with 90, might be valid but return as is
  if (cleanNumber.length === 12) {
    return cleanNumber
  }

  // Invalid format
  return null
}

/**
 * Check if an appointment slot is already booked (server-side conflict detection)
 * 
 * This function performs a database query to check if an appointment already exists
 * at the specified time for the given dietitian. Only appointments with statuses
 * that block the slot (pending, approved, completed) are considered conflicts.
 * Cancelled and rejected appointments do NOT block the slot.
 * 
 * @param dietitianId - The dietitian's user ID
 * @param startTime - The appointment start time as ISO string (UTC)
 * @param excludeAppointmentId - Optional: Exclude this appointment ID from conflict check (useful when editing)
 * @returns Promise<boolean> - true if conflict exists, false if slot is available
 */
export async function checkAppointmentConflict(
  dietitianId: string,
  startTime: string,
  excludeAppointmentId?: string
): Promise<boolean> {
  try {
    // Dynamic import to avoid SSR issues
    const { supabase } = await import('@/lib/supabase')
    
    // Build query for existing appointments at this exact time
    // Only check appointments with statuses that block the slot:
    // - pending: Waiting for approval (blocks slot)
    // - approved/confirmed: Confirmed appointment (blocks slot)
    // - completed: Completed appointment (blocks slot)
    // Exclude: cancelled, rejected (these do NOT block the slot)
    let query = supabase
      .from('appointments')
      .select('id')
      .eq('dietitian_id', dietitianId)
      .eq('start_time', startTime)
      .in('status', ['pending', 'approved', 'confirmed', 'completed'])

    // If editing an appointment, exclude it from conflict check
    if (excludeAppointmentId) {
      query = query.neq('id', excludeAppointmentId)
    }

    const { data, error } = await query.limit(1)

    if (error) {
      console.error('Error checking appointment conflict:', error)
      // On error, assume conflict exists to be safe (fail-safe approach)
      return true
    }

    // If any appointment found, conflict exists
    return (data?.length ?? 0) > 0
  } catch (err) {
    console.error('Exception in checkAppointmentConflict:', err)
    // On exception, assume conflict exists to be safe
    return true
  }
}
