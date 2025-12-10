'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Bell, Plus, X, CheckCircle, AlertCircle } from 'lucide-react'

type Announcement = {
  id: string
  message: string
  type: 'info' | 'warning'
  is_active: boolean
  created_at: string
}

export default function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    message: '',
    type: 'info' as 'info' | 'warning',
  })

  useEffect(() => {
    loadAnnouncements()
  }, [])

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('system_announcements')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAnnouncements(data || [])
    } catch (error: any) {
      toast.error('Duyurular yüklenirken hata: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.message.trim()) {
      toast.error('Mesaj boş olamaz')
      return
    }

    try {
      const { error } = await supabase
        .from('system_announcements')
        .insert({
          message: formData.message,
          type: formData.type,
          is_active: true,
        })

      if (error) throw error

      toast.success('Duyuru oluşturuldu!')
      setFormData({ message: '', type: 'info' })
      setIsCreating(false)
      loadAnnouncements()
    } catch (error: any) {
      toast.error('Duyuru oluşturulurken hata: ' + error.message)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('system_announcements')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error

      toast.success(`Duyuru ${!currentStatus ? 'aktif' : 'pasif'} edildi`)
      loadAnnouncements()
    } catch (error: any) {
      toast.error('Güncelleme hatası: ' + error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('system_announcements')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Duyuru silindi')
      loadAnnouncements()
    } catch (error: any) {
      toast.error('Silme hatası: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Yükleniyor...</p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Sistem Duyuruları
            </CardTitle>
            <CardDescription>
              Tüm kullanıcılara gösterilecek duyuruları yönetin
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsCreating(!isCreating)}
            variant="outline"
            size="sm"
          >
            {isCreating ? (
              <>
                <X className="w-4 h-4 mr-2" />
                İptal
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Yeni Duyuru
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCreating && (
          <form onSubmit={handleCreate} className="p-4 bg-gray-50 rounded-lg space-y-4">
            <div>
              <Label>Mesaj</Label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Duyuru mesajını buraya yazın..."
                rows={3}
                required
              />
            </div>
            <div>
              <Label>Tip</Label>
              <Select
                value={formData.type}
                onValueChange={(val) => setFormData({ ...formData, type: val as 'info' | 'warning' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Bilgi</SelectItem>
                  <SelectItem value="warning">Uyarı</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="submit">Oluştur</Button>
              <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                İptal
              </Button>
            </div>
          </form>
        )}

        {announcements.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Henüz duyuru yok</p>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`p-4 rounded-lg border ${
                  announcement.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {announcement.type === 'warning' ? (
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded ${
                          announcement.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {announcement.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                    <p className="text-gray-900 mb-2">{announcement.message}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(announcement.created_at), 'd MMMM yyyy, HH:mm', {
                        locale: tr,
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(announcement.id, announcement.is_active)}
                    >
                      {announcement.is_active ? 'Pasif Et' : 'Aktif Et'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(announcement.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}





