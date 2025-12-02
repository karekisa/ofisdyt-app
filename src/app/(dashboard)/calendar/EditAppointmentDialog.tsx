'use client'

type EditAppointmentDialogProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  appointment: any
}

export default function EditAppointmentDialog({
  isOpen,
  onClose,
  onSuccess,
  appointment,
}: EditAppointmentDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Randevu Düzenle</h2>
        <p className="text-gray-600 mb-4">Randevu düzenleme formu yakında eklenecek</p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Kapat
        </button>
      </div>
    </div>
  )
}
