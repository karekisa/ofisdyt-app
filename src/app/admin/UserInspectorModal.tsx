'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { X } from 'lucide-react'

type UserWithEmail = {
  id: string
  full_name: string | null
  email: string | null
  clinic_name: string | null
  phone: string | null
  public_slug: string | null
  subscription_status: 'active' | 'expired' | 'suspended' | null
  subscription_ends_at: string | null
  created_at: string
}

type UserInspectorModalProps = {
  user: UserWithEmail | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type UserStats = {
  clientsCount: number
  appointmentsCount: number
  transactionsCount: number
}

export default function UserInspectorModal({
  user,
  isOpen,
  onClose,
  onSuccess,
}: UserInspectorModalProps) {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<UserStats>({
    clientsCount: 0,
    appointmentsCount: 0,
    transactionsCount: 0,
  })
  const [formData, setFormData] = useState({
    full_name: '',
    clinic_name: '',
    phone: '',
    public_slug: '',
    subscription_ends_at: '',
  })

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        full_name: user.full_name || '',
        clinic_name: user.clinic_name || '',
        phone: user.phone || '',
        public_slug: user.public_slug || '',
        subscription_ends_at: user.subscription_ends_at
          ? format(new Date(user.subscription_ends_at), 'yyyy-MM-dd')
          : '',
      })
      loadUserStats(user.id)
    }
  }, [user, isOpen])

  const loadUserStats = async (userId: string) => {
    try {
      // Load clients count
      const { count: clientsCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('dietitian_id', userId)

      // Load appointments count
      const { count: appointmentsCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('dietitian_id', userId)

      // Load transactions count
      const { count: transactionsCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('dietitian_id', userId)

      setStats({
        clientsCount: clientsCount || 0,
        appointmentsCount: appointmentsCount || 0,
        transactionsCount: transactionsCount || 0,
      })
    } catch (error) {
      console.error('Error loading user stats:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)

    try {
      const updateData: any = {
        full_name: formData.full_name || null,
        clinic_name: formData.clinic_name || null,
        phone: formData.phone || null,
        public_slug: formData.public_slug || null,
      }

      if (formData.subscription_ends_at) {
        updateData.subscription_ends_at = new Date(formData.subscription_ends_at).toISOString()
        // Auto-update subscription status based on date
        const endDate = new Date(formData.subscription_ends_at)
        updateData.subscription_status = endDate > new Date() ? 'active' : 'expired'
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

      if (error) {
        toast.error('Güncelleme hatası: ' + error.message)
      } else {
        toast.success('Kullanıcı bilgileri güncellendi!')
        onSuccess()
        onClose()
      }
    } catch (error: any) {
      toast.error('Bir hata oluştu: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kullanıcı Detayları ve Düzenleme</DialogTitle>
          <DialogDescription>
            Kullanıcı bilgilerini görüntüleyin ve düzenleyin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Read-Only Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-500">Danışan Sayısı</p>
              <p className="text-2xl font-bold text-gray-900">{stats.clientsCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Randevu Sayısı</p>
              <p className="text-2xl font-bold text-gray-900">{stats.appointmentsCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">İşlem Sayısı</p>
              <p className="text-2xl font-bold text-gray-900">{stats.transactionsCount}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-2">Kayıt Tarihi</p>
            <p className="text-gray-900">
              {format(new Date(user.created_at), 'd MMMM yyyy, HH:mm', { locale: tr })}
            </p>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Ad Soyad</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Ad Soyad"
              />
            </div>

            <div>
              <Label htmlFor="clinic_name">Klinik Adı</Label>
              <Input
                id="clinic_name"
                value={formData.clinic_name}
                onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
                placeholder="Klinik Adı"
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+90 555 123 4567"
              />
            </div>

            <div>
              <Label htmlFor="public_slug">
                Randevu Linki (Slug) <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">diyetlik.com.tr/randevu/</span>
                <Input
                  id="public_slug"
                  value={formData.public_slug}
                  onChange={(e) => setFormData({ ...formData, public_slug: e.target.value })}
                  placeholder="ornek-slug"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Bu alanı düzenleyerek kullanıcının randevu linkini düzeltebilirsiniz.
              </p>
            </div>

            <div>
              <Label htmlFor="subscription_ends_at">Abonelik Bitiş Tarihi</Label>
              <Input
                id="subscription_ends_at"
                type="date"
                value={formData.subscription_ends_at}
                onChange={(e) => setFormData({ ...formData, subscription_ends_at: e.target.value })}
              />
            </div>

            <div>
              <Label>Email (Salt Okunur)</Label>
              <Input value={user.email || '-'} disabled className="bg-gray-50" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}





