'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'

type Measurement = {
  id: string
  client_id: string
  date: string
  weight: number | null
  body_fat_ratio: number | null
  muscle_ratio: number | null
  water_ratio: number | null
  waist_circumference: number | null
  hip_circumference: number | null
  arm_circumference: number | null
  leg_circumference: number | null
  created_at: string
}

type MeasurementsTabProps = {
  clientId: string
}

export default function MeasurementsTab({ clientId }: MeasurementsTabProps) {
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    weight: '',
    body_fat_ratio: '',
    muscle_ratio: '',
    water_ratio: '',
    waist_circumference: '',
    hip_circumference: '',
    arm_circumference: '',
    leg_circumference: '',
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

    if (error) {
      console.error('Error loading measurements:', error)
      toast.error('Ölçümler yüklenirken hata oluştu.')
    } else {
      setMeasurements(data as Measurement[])
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { error } = await supabase
      .from('measurements')
      .insert({
        client_id: clientId,
        date: formData.date,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        body_fat_ratio: formData.body_fat_ratio ? parseFloat(formData.body_fat_ratio) : null,
        muscle_ratio: formData.muscle_ratio ? parseFloat(formData.muscle_ratio) : null,
        water_ratio: formData.water_ratio ? parseFloat(formData.water_ratio) : null,
        waist_circumference: formData.waist_circumference ? parseFloat(formData.waist_circumference) : null,
        hip_circumference: formData.hip_circumference ? parseFloat(formData.hip_circumference) : null,
        arm_circumference: formData.arm_circumference ? parseFloat(formData.arm_circumference) : null,
        leg_circumference: formData.leg_circumference ? parseFloat(formData.leg_circumference) : null,
      })

    if (error) {
      toast.error('Ölçüm eklenirken hata: ' + error.message)
    } else {
      toast.success('Ölçüm başarıyla eklendi!')
      setIsDialogOpen(false)
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        weight: '',
        body_fat_ratio: '',
        muscle_ratio: '',
        water_ratio: '',
        waist_circumference: '',
        hip_circumference: '',
        arm_circumference: '',
        leg_circumference: '',
      })
      loadMeasurements()
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Bu ölçümü silmek istediğinize emin misiniz?')
    if (!confirmed) return

    const { error } = await supabase
      .from('measurements')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Ölçüm silinirken hata: ' + error.message)
    } else {
      toast.success('Ölçüm silindi!')
      loadMeasurements()
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Ölçümler</h3>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Ölçüm Ekle</span>
        </button>
      </div>

      {/* Measurements List */}
      {measurements.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-4">Henüz ölçüm eklenmemiş.</p>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>İlk Ölçümü Ekle</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {measurements.map((measurement) => (
            <div
              key={measurement.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 text-sm text-gray-500 mb-3">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {format(parseISO(measurement.date), 'd MMMM yyyy', {
                        locale: tr,
                      })}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {measurement.weight !== null && (
                      <div>
                        <p className="text-sm text-gray-500">Kilo</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {measurement.weight} kg
                        </p>
                      </div>
                    )}
                    {measurement.body_fat_ratio !== null && (
                      <div>
                        <p className="text-sm text-gray-500">Yağ Oranı</p>
                        <p className="text-lg font-semibold text-gray-900">
                          %{measurement.body_fat_ratio}
                        </p>
                      </div>
                    )}
                    {measurement.muscle_ratio !== null && (
                      <div>
                        <p className="text-sm text-gray-500">Kas Kütlesi</p>
                        <p className="text-lg font-semibold text-gray-900">
                          %{measurement.muscle_ratio}
                        </p>
                      </div>
                    )}
                    {measurement.water_ratio !== null && (
                      <div>
                        <p className="text-sm text-gray-500">Su Oranı</p>
                        <p className="text-lg font-semibold text-gray-900">
                          %{measurement.water_ratio}
                        </p>
                      </div>
                    )}
                    {measurement.waist_circumference !== null && (
                      <div>
                        <p className="text-sm text-gray-500">Bel Çevresi</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {measurement.waist_circumference} cm
                        </p>
                      </div>
                    )}
                    {measurement.hip_circumference !== null && (
                      <div>
                        <p className="text-sm text-gray-500">Kalça Çevresi</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {measurement.hip_circumference} cm
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(measurement.id)}
                  className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  aria-label="Ölçümü sil"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Measurement Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full my-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Yeni Ölçüm Ekle</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tarih <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Body Composition Section */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vücut Kompozisyonu</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kilo (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="Örn: 75.5"
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
                      value={formData.body_fat_ratio}
                      onChange={(e) => setFormData({ ...formData, body_fat_ratio: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="Örn: 25.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kas Kütlesi (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.muscle_ratio}
                      onChange={(e) => setFormData({ ...formData, muscle_ratio: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="Örn: 40.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vücut Su Oranı (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.water_ratio}
                      onChange={(e) => setFormData({ ...formData, water_ratio: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="Örn: 55.0"
                    />
                  </div>
                </div>
              </div>

              {/* Circumference Measurements Section */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Çevre Ölçümleri (cm)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bel Çevresi (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.waist_circumference}
                      onChange={(e) => setFormData({ ...formData, waist_circumference: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="Örn: 85.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kalça Çevresi (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.hip_circumference}
                      onChange={(e) => setFormData({ ...formData, hip_circumference: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="Örn: 95.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kol Çevresi (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.arm_circumference}
                      onChange={(e) => setFormData({ ...formData, arm_circumference: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="Örn: 30.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bacak Çevresi (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.leg_circumference}
                      onChange={(e) => setFormData({ ...formData, leg_circumference: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="Örn: 55.0"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
