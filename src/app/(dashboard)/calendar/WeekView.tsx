'use client'

type WeekViewProps = {
  weekStart: Date
  appointments: any[]
  profile: { work_start_hour: number; work_end_hour: number; session_duration: number } | null
  onAppointmentClick: (appointment: any) => void
  onDateClick: (date: Date) => void
}

export default function WeekView({
  weekStart,
  appointments,
  profile,
  onAppointmentClick,
  onDateClick,
}: WeekViewProps) {
  return (
    <div className="p-6">
      <p className="text-gray-500 text-center py-12">
        Haftalık görünüm yakında eklenecek
      </p>
    </div>
  )
}
