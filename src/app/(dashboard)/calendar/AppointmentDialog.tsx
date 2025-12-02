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
import { Client } from '@/lib/types'
import { checkAppointmentConflict } from '@/lib/utils'
import { generateTimeSlotsFromHours } from '@/lib/time-utils'
import { toast } from 'sonner'

type AppointmentDialogProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  selectedDate: Date | null
}

export default function AppointmentDialog({
  isOpen,
  onClose,
  onSuccess,
  selectedDate,
}: AppointmentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [workHours, setWorkHours] = useState<{
    work_start_hour: number
    work_end_hour: number
  } | null>(null)
  const [timeSlots, setTimeSlots] = useState<string[]>([])
  const [formData, setFormData] = useState({
    client_id: '',
    guest_name: '',
    guest_phone: '',
    date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    time: '',
    notes: '',
  })

  useEffect(() => {
    if (isOpen) {
      loadClients()
      loadWorkHours()
      if (selectedDate) {
        setFormData((prev) => ({
          ...prev,
          date: format(selectedDate, 'yyyy-MM-dd'),
        }))
      }
    }
  }, [isOpen, selectedDate])

  useEffect(() => {
    if (workHours) {
      // Fixed 30-minute session duration globally
      const slots = generateTimeSlotsFromHours(
        workHours.work_start_hour,
        workHours.work_end_hour,
        30 // Fixed to 30 minutes
      )
      setTimeSlots(slots)
      // Reset time if current selection is not in the new slots
      if (formData.time && !slots.includes(formData.time)) {
        setFormData((prev) => ({ ...prev, time: '' }))
      }
    }
  }, [workHours])

  const loadClients = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('dietitian_id', user.id)
      .order('name', { ascending: true })

    if (data) {
      setClients(data as Client[])
    }
  }

  const loadWorkHours = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('work_start_hour, work_end_hour')
      .eq('id', user.id)
      .single()

    if (data) {
      setWorkHours({
        work_start_hour: data.work_start_hour || 9,
        work_end_hour: data.work_end_hour || 17,
      })
    } else {
      // Default values if profile not found
      setWorkHours({
        work_start_hour: 9,
        work_end_hour: 17,
      })
    }
  }

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

    // Validate: either client_id or guest_name must be provided
    if (!formData.client_id && !formData.guest_name) {
      alert('Lütfen bir danışan seçin veya misafir adı girin')
      setLoading(false)
      return
    }

    if (!formData.time) {
      alert('Lütfen saat seçin')
      setLoading(false)
      return
    }

    // Combine date and time to create ISO string (UTC)
    // This ensures the format matches exactly how it's stored in the database
    const [hours, minutes] = formData.time.split(':')
    const startTime = new Date(formData.date)
    startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    const startTimeISO = startTime.toISOString()

    // MANDATORY CONFLICT DETECTION: Check if slot is already taken
    // This prevents double bookings by checking for existing appointments
    // at the exact same time with active statuses (pending, approved, completed)
    // Cancelled and rejected appointments do NOT block the slot
    const hasConflict = await checkAppointmentConflict(user.id, startTimeISO)

    if (hasConflict) {
      // STOP execution immediately - do not insert
      toast.error('Hata: Bu saatte zaten onaylanmış/bekleyen başka bir randevu mevcut. Lütfen farklı bir saat seçin.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('appointments').insert({
      dietitian_id: user.id,
      client_id: formData.client_id || null,
      guest_name: formData.guest_name || null,
      guest_phone: formData.guest_phone || null,
      start_time: startTimeISO,
      status: 'approved', // Manual appointments are auto-approved
    })

    if (error) {
      toast.error('Randevu oluşturulurken hata: ' + error.message)
      setLoading(false)
    } else {
      toast.success('Randevu başarıyla oluşturuldu!')
      onSuccess()
      onClose()
      // Reset form
      setFormData({
        client_id: '',
        guest_name: '',
        guest_phone: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '',
        notes: '',
      })
      setSearchTerm('')
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Yeni Randevu</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client">Danışan</Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => {
                setFormData({ ...formData, client_id: value, guest_name: '' })
                setSearchTerm('')
              }}
            >
              <SelectTrigger id="client" className="text-base h-12">
                <SelectValue placeholder="Danışan seçin veya misafir adı girin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Misafir Randevu</SelectItem>
                {filteredClients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Guest Name (if no client selected) */}
          {!formData.client_id && (
            <div className="space-y-2">
              <Label htmlFor="guest_name">Misafir Adı *</Label>
              <Input
                id="guest_name"
                type="text"
                value={formData.guest_name}
                onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                className="text-base h-12"
                placeholder="Misafir adı soyadı"
                required={!formData.client_id}
              />
            </div>
          )}

          {/* Guest Phone (if no client selected) */}
          {!formData.client_id && (
            <div className="space-y-2">
              <Label htmlFor="guest_phone">Misafir Telefon</Label>
              <Input
                id="guest_phone"
                type="tel"
                value={formData.guest_phone}
                onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                className="text-base h-12"
                placeholder="+90 555 123 4567"
              />
            </div>
          )}

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Tarih *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="text-base h-12"
              required
            />
          </div>

          {/* Time Slot Selection */}
          <div className="space-y-2">
            <Label htmlFor="time">Saat *</Label>
            {timeSlots.length === 0 ? (
              <div className="text-sm text-gray-500 py-2">
                Çalışma saatleri yükleniyor...
              </div>
            ) : (
              <Select
                value={formData.time}
                onValueChange={(value) => setFormData({ ...formData, time: value })}
              >
                <SelectTrigger id="time" className="text-base h-12">
                  <SelectValue placeholder="Saat seçin" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {workHours && (
              <p className="text-xs text-gray-500 mt-1">
                Çalışma saatleri: {String(workHours.work_start_hour).padStart(2, '0')}:00 - {String(workHours.work_end_hour).padStart(2, '0')}:00 
                {' • '}Seans süresi: 30 dakika
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notlar</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="text-base resize-none"
              placeholder="Randevu hakkında notlar..."
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
              {loading ? 'Oluşturuluyor...' : 'Randevu Oluştur'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
