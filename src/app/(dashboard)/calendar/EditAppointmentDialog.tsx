'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { Appointment, Client } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { appointmentStatusMap } from '@/lib/constants'
import { checkAppointmentConflict } from '@/lib/utils'

type EditAppointmentDialogProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  appointment: Appointment | null
}

export default function EditAppointmentDialog({
  isOpen,
  onClose,
  onSuccess,
  appointment,
}: EditAppointmentDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [formData, setFormData] = useState({
    client_id: '',
    guest_name: '',
    guest_phone: '',
    date: '',
    time: '',
    status: 'approved' as 'pending' | 'approved' | 'rejected' | 'completed',
    notes: '',
  })

  useEffect(() => {
    if (isOpen && appointment) {
      loadClients()
      const appointmentDate = parseISO(appointment.start_time)
      setFormData({
        client_id: appointment.client_id || '',
        guest_name: appointment.guest_name || '',
        guest_phone: appointment.guest_phone || '',
        date: format(appointmentDate, 'yyyy-MM-dd'),
        time: format(appointmentDate, 'HH:mm'),
        status: appointment.status,
        notes: '', // Add notes field if you have it in your schema
      })
    }
  }, [isOpen, appointment])

  const loadClients = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('dietitian_id', user.id)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error loading clients:', error)
      toast.error('Danışanlar yüklenirken hata oluştu.')
    } else {
      setClients(data as Client[])
    }
    setLoadingClients(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!appointment) return

    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Randevu güncellemek için giriş yapmalısınız.')
      setSubmitting(false)
      return
    }

    if (!formData.client_id && (!formData.guest_name || !formData.guest_phone)) {
      toast.error('Lütfen bir danışan seçin veya misafir bilgilerini girin.')
      setSubmitting(false)
      return
    }

    const [hours, minutes] = formData.time.split(':').map(Number)
    const startTime = new Date(formData.date)
    startTime.setHours(hours, minutes, 0, 0)
    const startTimeISO = startTime.toISOString()

    // Server-side conflict detection: Check if the new time conflicts with another appointment
    // Exclude the current appointment being edited from the conflict check
    const hasConflict = await checkAppointmentConflict(
      user.id,
      startTimeISO,
      appointment.id // Exclude current appointment from conflict check
    )

    if (hasConflict) {
      toast.error('Bu saatte zaten başka bir randevu mevcut!')
      setSubmitting(false)
      return
    }

    const { error } = await supabase
      .from('appointments')
      .update({
        client_id: formData.client_id || null,
        guest_name: formData.client_id ? null : formData.guest_name,
        guest_phone: formData.client_id ? null : formData.guest_phone,
        start_time: startTimeISO,
        status: formData.status,
      })
      .eq('id', appointment.id)

    if (error) {
      console.error('Error updating appointment:', error)
      toast.error('Randevu güncellenirken hata oluştu: ' + error.message)
    } else {
      toast.success('Randevu başarıyla güncellendi!')
      onSuccess()
      onClose()
    }
    setSubmitting(false)
  }

  const handleDelete = async () => {
    if (!appointment) return

    const confirmed = window.confirm('Bu randevuyu silmek istediğinizden emin misiniz?')
    if (!confirmed) return

    setDeleting(true)

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointment.id)

    if (error) {
      console.error('Error deleting appointment:', error)
      toast.error('Randevu silinirken hata oluştu: ' + error.message)
    } else {
      toast.success('Randevu başarıyla silindi!')
      onSuccess()
      onClose()
    }
    setDeleting(false)
  }

  const isGuestFormVisible = !formData.client_id

  if (!appointment) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto rounded-lg">
        <DialogHeader>
          <DialogTitle>Randevu Düzenle</DialogTitle>
          <DialogDescription>
            Randevu bilgilerini güncelleyin veya silin.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">Danışan Seçin (Opsiyonel)</Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => setFormData({ ...formData, client_id: value, guest_name: '', guest_phone: '' })}
            >
              <SelectTrigger className="w-full text-base" disabled={loadingClients}>
                <SelectValue placeholder="Mevcut danışanlardan seçin" />
              </SelectTrigger>
              <SelectContent>
                {clients.length === 0 && !loadingClients && (
                  <div className="px-2 py-1.5 text-sm text-gray-500">Danışan bulunamadı</div>
                )}
                <SelectItem value="">Yok (Misafir)</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isGuestFormVisible && (
            <>
              <div className="space-y-2">
                <Label htmlFor="guest_name">Misafir Adı Soyadı</Label>
                <Input
                  id="guest_name"
                  value={formData.guest_name}
                  onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                  className="text-base"
                  placeholder="Misafir danışanın adı"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guest_phone">Misafir Telefon Numarası</Label>
                <Input
                  id="guest_phone"
                  type="tel"
                  value={formData.guest_phone}
                  onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                  className="text-base"
                  placeholder="+90 5xx xxx xx xx"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Tarih</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Saat</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
                className="text-base"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Durum</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value as 'pending' | 'approved' | 'rejected' | 'completed' })
              }
            >
              <SelectTrigger className="w-full text-base">
                <SelectValue />
              </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{appointmentStatusMap.pending}</SelectItem>
                    <SelectItem value="approved">{appointmentStatusMap.approved}</SelectItem>
                    <SelectItem value="rejected">{appointmentStatusMap.rejected}</SelectItem>
                    <SelectItem value="completed">{appointmentStatusMap.completed}</SelectItem>
                    <SelectItem value="cancelled">{appointmentStatusMap.cancelled}</SelectItem>
                  </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || submitting}
              className="w-full sm:w-auto h-12 text-base"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleting ? 'Siliniyor...' : 'Sil'}
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitting || deleting}
                className="flex-1 sm:flex-none h-12 text-base"
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={submitting || deleting}
                className="flex-1 sm:flex-none h-12 text-base bg-green-600 hover:bg-green-700"
              >
                {submitting ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
