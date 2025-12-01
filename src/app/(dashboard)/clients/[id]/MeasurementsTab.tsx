'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

type Measurement = {
  id: string
  date: string
  weight: number | null
  body_fat_ratio: number | null
}

export default function MeasurementsTab({ clientId }: { clientId: string }) {
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    weight: '',
    body_fat_ratio: '',
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
      setMeasurements(data)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('measurements').insert({
      client_id: clientId,
      date: formData.date,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      body_fat_ratio: formData.body_fat_ratio
        ? parseFloat(formData.body_fat_ratio)
        : null,
    })

    if (error) {
      alert('Ölçüm eklenirken hata: ' + error.message)
    } else {
      setShowForm(false)
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        weight: '',
        body_fat_ratio: '',
      })
      loadMeasurements()
    }
    setLoading(false)
  }

  if (loading && measurements.length === 0) {
    return <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Ölçümler</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Ölçüm Ekle</span>
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-50 rounded-lg p-4 space-y-4 border border-gray-200"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tarih
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kilo (kg)
              </label>
              <input
                type="number"
                step="0.1"
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
                value={formData.body_fat_ratio}
                onChange={(e) =>
                  setFormData({ ...formData, body_fat_ratio: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="Yağ oranı"
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      )}

      {measurements.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Henüz ölçüm kaydı yok
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tarih
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Kilo (kg)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Yağ Oranı (%)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {measurements.map((measurement) => (
                <tr key={measurement.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {format(new Date(measurement.date), 'PP', { locale: tr })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {measurement.weight?.toFixed(1) || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {measurement.body_fat_ratio?.toFixed(1) || '-'}
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

