'use client'

type MonthViewProps = {
  month: Date
  appointments: any[]
  onAppointmentClick: (appointment: any) => void
  onDateClick: (date: Date) => void
}

export default function MonthView({
  month,
  appointments,
  onAppointmentClick,
  onDateClick,
}: MonthViewProps) {
  return (
    <div className="p-6">
      <p className="text-gray-500 text-center py-12">
        Aylık görünüm yakında eklenecek
      </p>
    </div>
  )
}
