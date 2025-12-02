import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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







