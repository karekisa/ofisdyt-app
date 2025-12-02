'use client'

type AddTransactionDialogProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddTransactionDialog({
  isOpen,
  onClose,
  onSuccess,
}: AddTransactionDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Yeni İşlem Ekle</h2>
        <p className="text-gray-600 mb-4">İşlem ekleme formu yakında eklenecek</p>
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
