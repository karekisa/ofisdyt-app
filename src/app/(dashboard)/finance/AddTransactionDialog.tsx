'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X } from 'lucide-react'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type AddTransactionDialogProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const transactionCategories = [
  { value: 'seans', label: 'Seans Ücreti' },
  { value: 'kira', label: 'Kira' },
  { value: 'fatura', label: 'Fatura' },
  { value: 'maas', label: 'Maaş' },
  { value: 'malzeme', label: 'Malzeme' },
  { value: 'diger', label: 'Diğer' },
]

const paymentMethods = [
  { value: 'cash', label: 'Nakit' },
  { value: 'credit_card', label: 'Kredi Kartı' },
  { value: 'transfer', label: 'Havale/EFT' },
]

export default function AddTransactionDialog({
  isOpen,
  onClose,
  onSuccess,
}: AddTransactionDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    category: '',
    amount: '',
    description: '',
    payment_method: 'cash' as 'cash' | 'credit_card' | 'transfer',
    transaction_date: format(new Date(), 'yyyy-MM-dd'),
    client_id: '',
  })
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    if (isOpen) {
      loadClients()
    }
  }, [isOpen])

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
      setClients(data as { id: string; name: string }[])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    if (!formData.category || !formData.amount) {
      alert('Lütfen kategori ve tutar alanlarını doldurun')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('transactions').insert({
      dietitian_id: user.id,
      type: formData.type,
      category: formData.category,
      amount: parseFloat(formData.amount),
      description: formData.description || null,
      payment_method: formData.payment_method,
      transaction_date: formData.transaction_date,
      client_id: formData.client_id || null,
    })

    if (error) {
      alert('İşlem eklenirken hata: ' + error.message)
      setLoading(false)
    } else {
      onSuccess()
      onClose()
      // Reset form
      setFormData({
        type: 'income',
        category: '',
        amount: '',
        description: '',
        payment_method: 'cash',
        transaction_date: format(new Date(), 'yyyy-MM-dd'),
        client_id: '',
      })
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Yeni İşlem Ekle</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Type Tabs */}
          <div>
            <Label className="mb-3 block">İşlem Tipi</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'income' })}
                className={`p-4 rounded-lg border-2 text-base font-medium transition-colors ${
                  formData.type === 'income'
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-700'
                }`}
              >
                Gelir
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'expense' })}
                className={`p-4 rounded-lg border-2 text-base font-medium transition-colors ${
                  formData.type === 'expense'
                    ? 'border-red-600 bg-red-50 text-red-700'
                    : 'border-gray-200 bg-white text-gray-700'
                }`}
              >
                Gider
              </button>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Kategori *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger id="category" className="text-base h-12">
                <SelectValue placeholder="Kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                {transactionCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Tutar *</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-base">
                ₺
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="pl-8 text-base h-12"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Tarih *</Label>
            <Input
              id="date"
              type="date"
              value={formData.transaction_date}
              onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
              className="text-base h-12"
              required
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="payment_method">Ödeme Yöntemi</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) =>
                setFormData({ ...formData, payment_method: value as 'cash' | 'credit_card' | 'transfer' })
              }
            >
              <SelectTrigger id="payment_method" className="text-base h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Client (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="client">Danışan (Opsiyonel)</Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => setFormData({ ...formData, client_id: value })}
            >
              <SelectTrigger id="client" className="text-base h-12">
                <SelectValue placeholder="Danışan seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Danışan yok</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="text-base resize-none"
              placeholder="İşlem hakkında notlar..."
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto h-12 text-base"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:flex-1 h-12 text-base"
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
