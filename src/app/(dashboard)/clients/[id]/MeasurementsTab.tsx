'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'

type Measurement = {
  id: string
  date: string
  weight: number | null
  body_fat_ratio: number | null
  created_at: string
}

export default function MeasurementsTab({ clientId }: { clientId: string }) {
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    bodyFat: '',
  })

  useEffect(() => {
    loadMeasurements()
  }, [clientId])

  const loadMeasurements = async () => {
    const { data, error } = await supabase
      .from('measurements')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false })

    if (!error && data) {
      setMeasurements(data as Measurement[])
    }
    setLoading(false)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('measurements').insert({
      client_id: clientId,
      date: formData.date,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      body_fat_ratio: formData.bodyFat ? parseFloat(formData.bodyFat) : null,
    })

    if (error) {
      alert('Ölçüm eklenirken hata: ' + error.message)
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        weight: '',
        bodyFat: '',
      })
      setIsAdding(false)
      loadMeasurements()
    }

    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu ölçümü silmek istediğinize emin misiniz?')) {
      return
    }

    const { error } = await supabase.from('measurements').delete().eq('id', id)

    if (error) {
      alert('Silinirken hata: ' + error.message)
    } else {
      loadMeasurements()
    }
  }

  if (loading && measurements.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Ölçümler</h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Ölçüm Ekle</span>
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tarih <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kilo (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.weight}
                onChange={(e) =>
                  setFormData({ ...formData, weight: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="Kilo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Yağ Oranı (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.bodyFat}
                onChange={(e) =>
                  setFormData({ ...formData, bodyFat: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="Yağ oranı"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
            >
              Ekle
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              İptal
            </button>
          </div>
        </form>
      )}

      {measurements.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500">Henüz ölçüm eklenmemiş.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Tarih
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Kilo (kg)
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Yağ Oranı (%)
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody>
              {measurements.map((measurement) => (
                <tr
                  key={measurement.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {format(parseISO(measurement.date), 'd MMMM yyyy', {
                      locale: tr,
                    })}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {measurement.weight !== null
                      ? measurement.weight.toFixed(1)
                      : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {measurement.body_fat_ratio !== null
                      ? measurement.body_fat_ratio.toFixed(1)
                      : '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDelete(measurement.id)}
                      className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      aria-label="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
