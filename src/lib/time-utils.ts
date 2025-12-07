/**
 * Time slot generation utilities
 * Enforces settings-based time slots for consistent booking
 */

/**
 * Generate time slots based on work hours and session duration
 * 
 * @param startStr - Start time in "HH:mm" format (e.g., "09:00")
 * @param endStr - End time in "HH:mm" format (e.g., "17:00")
 * @param durationMinutes - Duration in minutes (e.g., 15, 30, 45, 60)
 * @returns Array of time strings in "HH:mm" format
 * 
 * @example
 * generateTimeSlots("09:00", "17:00", 45)
 * // Returns: ["09:00", "09:45", "10:30", "11:15", "12:00", "12:45", "13:30", "14:15", "15:00", "15:45", "16:30"]
 */
export function generateTimeSlots(
  startStr: string,
  endStr: string,
  durationMinutes: number
): string[] {
  // Default values if inputs are missing
  const start = startStr || '09:00'
  const end = endStr || '17:00'
  const duration = durationMinutes || 45

  const slots: string[] = []
  
  // Parse start time
  const [startHours, startMinutes] = start.split(':').map(Number)
  const startTotalMinutes = startHours * 60 + startMinutes

  // Parse end time
  const [endHours, endMinutes] = end.split(':').map(Number)
  const endTotalMinutes = endHours * 60 + endMinutes

  // Validate inputs
  if (isNaN(startTotalMinutes) || isNaN(endTotalMinutes) || duration <= 0) {
    console.warn('Invalid time slot parameters, using defaults')
    return generateTimeSlots('09:00', '17:00', 45)
  }

  // Generate slots
  let currentMinutes = startTotalMinutes

  while (currentMinutes < endTotalMinutes) {
    const hours = Math.floor(currentMinutes / 60)
    const minutes = currentMinutes % 60
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    
    // Check if adding duration would exceed end time
    if (currentMinutes + duration > endTotalMinutes) {
      break
    }

    slots.push(timeString)
    currentMinutes += duration
  }

  return slots
}

/**
 * Convert numeric hours to time string format
 * 
 * @param hour - Hour as number (0-23)
 * @returns Time string in "HH:mm" format
 */
export function hourToTimeString(hour: number): string {
  const normalizedHour = Math.max(0, Math.min(23, Math.floor(hour)))
  return `${normalizedHour.toString().padStart(2, '0')}:00`
}

/**
 * Generate time slots from numeric work hours (for backward compatibility)
 * 
 * @param workStartHour - Start hour as number (0-23)
 * @param workEndHour - End hour as number (0-23)
 * @param sessionDuration - Duration in minutes
 * @returns Array of time strings in "HH:mm" format
 */
export function generateTimeSlotsFromHours(
  workStartHour: number,
  workEndHour: number,
  sessionDuration: number
): string[] {
  const startStr = hourToTimeString(workStartHour)
  const endStr = hourToTimeString(workEndHour)
  return generateTimeSlots(startStr, endStr, sessionDuration)
}






