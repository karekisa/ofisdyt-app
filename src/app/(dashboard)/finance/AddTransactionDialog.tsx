'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X } from 'lucide-react'
import { format } from 'date-fns'

const INCOME_CATEGORIES = ['Seans Ücreti', 'Danışmanlık', 'Diğer']
const EXPENSE_CATEGORIES = ['Kira', 'Fatura', 'Aidat', 'Yemek', 'Diğer']
const PAYMENT_METHODS = [
  { value: 'cash', label: 'Nakit' },
  { value: 'credit_card', label: 'Kredi Kartı' },
  { value: 'transfer', label: 'Havale/EFT' },
]

type Client = {
  id: string
  name: string
}

type AddTransactionDialogProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  selectedDate: Date
}

export default function AddTransactionDialog({
  isOpen,
  onClose,
  onSuccess,
  selectedDate,
}: AddTransactionDialogProps) {
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    amount: '',
    category: '',
    description: '',
    payment_method: 'cash' as 'cash' | 'credit_card' | 'transfer',
    transaction_date: format(selectedDate, 'yyyy-MM-dd'),
    client_id: '',
  })
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    if (isOpen) {
      checkUser()
      loadClients()
      // Reset form
      setFormData({
        type: 'income',
        amount: '',
        category: '',
        description: '',
        payment_method: 'cash',
        transaction_date: format(selectedDate, 'yyyy-MM-dd'),
        client_id: '',
      })
    }
  }, [isOpen, selectedDate])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    setUser(user)
  }

  const loadClients = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('clients')
      .select('id, name')
      .eq('dietitian_id', user.id)
      .order('name', { ascending: true })

    if (data) {
      setClients(data as Client[])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!formData.amount || !formData.category) {
      alert('Lütfen tüm zorunlu alanları doldurun')
      return
    }

    setLoading(true)

    const { error } = await supabase.from('transactions').insert({
      dietitian_id: user.id,
      type: formData.type,
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description || null,
      payment_method: formData.payment_method,
      transaction_date: formData.transaction_date,
      client_id: formData.client_id || null,
    })

    setLoading(false)

    if (error) {
      alert('Hata: ' + error.message)
      return
    }

    onSuccess()
    onClose()
  }

  const currentCategories =
    formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[95vw] md:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Yeni İşlem Ekle</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tür <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="income"
                  checked={formData.type === 'income'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: 'income',
                      category: '', // Reset category when type changes
                    })
                  }
                  className="w-4 h-4 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-green-600">Gelir</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="expense"
                  checked={formData.type === 'expense'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: 'expense',
                      category: '', // Reset category when type changes
                    })
                  }
                  className="w-4 h-4 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm font-medium text-red-600">Gider</span>
              </label>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tutar (₺) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="0.00"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            >
              <option value="">Kategori Seçin</option>
              {currentCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ödeme Yöntemi <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.payment_method}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  payment_method: e.target.value as 'cash' | 'credit_card' | 'transfer',
                })
              }
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tarih <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.transaction_date}
              onChange={(e) =>
                setFormData({ ...formData, transaction_date: e.target.value })
              }
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Client (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Danışan (Opsiyonel)
            </label>
            <select
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            >
              <option value="">Danışan Seçin</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Açıklama
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="İşlem açıklaması (opsiyonel)"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}





