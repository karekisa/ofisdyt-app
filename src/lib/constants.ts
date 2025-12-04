/**
 * Status mapping for appointments
 */
export const appointmentStatusMap: Record<string, string> = {
  pending: 'Bekliyor 🟡',
  approved: 'Onaylandı 🟢',
  confirmed: 'Onaylandı 🟢', // Alias for approved
  completed: 'Tamamlandı 🔵',
  cancelled: 'İptal Edildi 🔴',
  rejected: 'Reddedildi 🔴',
}

/**
 * Payment method mapping
 */
export const paymentMethodMap: Record<string, string> = {
  cash: 'Nakit 💵',
  credit_card: 'Kredi Kartı 💳',
  transfer: 'Havale/EFT 🏦',
  eft: 'Havale/EFT 🏦',
  other: 'Diğer',
}

/**
 * Transaction type mapping
 */
export const transactionTypeMap: Record<string, string> = {
  income: 'Gelir 📥',
  expense: 'Gider 📤',
}

/**
 * Format category name from slug to readable text
 * @param category - Category slug (e.g., "consultation_fee")
 * @returns Formatted category name (e.g., "Consultation Fee")
 */
export function formatCategoryName(category: string | null | undefined): string {
  if (!category) return 'Diğer'
  
  // If already formatted, return as is
  if (category.includes(' ')) return category
  
  // Convert snake_case or kebab-case to Title Case
  return category
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}




