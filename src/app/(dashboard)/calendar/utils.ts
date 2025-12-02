import { addMinutes, format, startOfDay } from 'date-fns'

/**
 * Generate time slots based on work hours and session duration
 * @param workStartHour - Start hour (0-23)
 * @param workEndHour - End hour (0-23)
 * @param sessionDuration - Duration in minutes (e.g., 15, 30, 45, 60)
 * @returns Array of time strings in "HH:mm" format
 */
export function generateTimeSlots(
  workStartHour: number,
  workEndHour: number,
  sessionDuration: number
): string[] {
  const slots: string[] = []
  const baseDate = startOfDay(new Date())
  let currentTime = new Date(baseDate)
  currentTime.setHours(workStartHour, 0, 0, 0)

  const endTime = new Date(baseDate)
  endTime.setHours(workEndHour, 0, 0, 0)

  while (currentTime < endTime) {
    const slotEndTime = addMinutes(currentTime, sessionDuration)

    // Check if slot would exceed end time
    if (slotEndTime > endTime) {
      break
    }

    slots.push(format(currentTime, 'HH:mm'))
    currentTime = addMinutes(currentTime, sessionDuration)
  }

  return slots
}

/**
 * Find the slot index for a given time
 * @param timeString - Time in "HH:mm" format
 * @param slots - Array of time slot strings
 * @returns Index of the slot, or -1 if not found
 */
export function findSlotIndex(timeString: string, slots: string[]): number {
  return slots.findIndex((slot) => slot === timeString)
}

/**
 * Find the closest slot index for a given time
 * @param timeString - Time in "HH:mm" format
 * @param slots - Array of time slot strings
 * @returns Index of the closest slot
 */
export function findClosestSlotIndex(timeString: string, slots: string[]): number {
  const exactIndex = findSlotIndex(timeString, slots)
  if (exactIndex !== -1) return exactIndex

  // Find closest slot
  const [hours, minutes] = timeString.split(':').map(Number)
  const targetMinutes = hours * 60 + minutes

  let closestIndex = 0
  let minDiff = Infinity

  slots.forEach((slot, index) => {
    const [slotHours, slotMinutes] = slot.split(':').map(Number)
    const slotTotalMinutes = slotHours * 60 + slotMinutes
    const diff = Math.abs(targetMinutes - slotTotalMinutes)

    if (diff < minDiff) {
      minDiff = diff
      closestIndex = index
    }
  })

  return closestIndex
}







