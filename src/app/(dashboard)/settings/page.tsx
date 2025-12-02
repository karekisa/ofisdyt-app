'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Profile } from '@/lib/types'

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      
      if (data) {
        // BURASI HATAYI ÇÖZEN KISIM: Veriyi zorla kabul ettiriyoruz
        setProfile(data as any)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          clinic_name: profile.clinic_name,
          phone: profile.phone,
          bio: profile.bio,
          website: profile.website,
        })
        .eq('id', profile.id)

      if (error) throw error
      toast.success('Profil bilgileri güncellendi')
    } catch (error) {
      toast.error('Güncelleme başarısız oldu')
      console.error(error)
    }
  }

  const updateBookingConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          public_slug: profile.public_slug,
          work_start_hour: profile.work_start_hour,
          work_end_hour: profile.work_end_hour,
          session_duration: profile.session_duration,
        })
        .eq('id', profile.id)

      if (error) throw error
      toast.success('Randevu ayarları kaydedildi')
    } catch (error) {
      toast.error('Ayarlar kaydedilemedi')
      console.error(error)
    }
  }

  if (loading) return <div className="p-8">Yükleniyor...</div>
  if (!profile) return <div className="p-8">Profil bulunamadı.</div>

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Ayarlar</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KART 1: PROFIL BILGILERI */}
        <Card>
          <CardHeader>
            <CardTitle>Profil Bilgileri</CardTitle>
            <CardDescription>Danışanlarınızın göreceği genel bilgiler.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={updateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label>Ad Soyad</Label>
                <Input 
                  value={profile.full_name || ''} 
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Klinik Adı</Label>
                <Input 
                  value={profile.clinic_name || ''} 
                  onChange={(e) => setProfile({ ...profile, clinic_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefon (İletişim)</Label>
                <Input 
                  placeholder="0555 555 55 55"
                  value={profile.phone || ''} 
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Web Sitesi / Instagram</Label>
                <Input 
                  placeholder="https://..."
                  value={profile.website || ''} 
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Hakkımda (Bio)</Label>
                <Textarea 
                  className="min-h-[100px]"
                  placeholder="Kendinizden kısaca bahsedin..."
                  value={profile.bio || ''} 
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">Profili Güncelle</Button>
            </form>
          </CardContent>
        </Card>

        {/* KART 2: RANDEVU AYARLARI */}
        <Card>
          <CardHeader>
            <CardTitle>Randevu Ayarları</CardTitle>
            <CardDescription>Randevu sayfasının nasıl çalışacağını belirleyin.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={updateBookingConfig} className="space-y-4">
              <div className="space-y-2">
                <Label>Randevu Linki (Slug)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">ofisdyt.com/book/</span>
                  <Input 
                    value={profile.public_slug || ''} 
                    onChange={(e) => setProfile({ ...profile, public_slug: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mesai Başlangıç</Label>
                  <Select 
                    value={profile.work_start_hour?.toString() || '9'} 
                    onValueChange={(val) => setProfile({ ...profile, work_start_hour: parseInt(val) || 9 })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 13 }, (_, i) => i + 7).map((hour) => (
                        <SelectItem key={hour} value={hour.toString()}>
                          {`${hour.toString().padStart(2, '0')}:00`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Mesai Bitiş</Label>
                  <Select 
                    value={profile.work_end_hour?.toString() || '18'} 
                    onValueChange={(val) => setProfile({ ...profile, work_end_hour: parseInt(val) || 18 })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 13 }, (_, i) => i + 12).map((hour) => (
                        <SelectItem key={hour} value={hour.toString()}>
                          {`${hour.toString().padStart(2, '0')}:00`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Seans Süresi (Dakika)</Label>
                <Select 
                    value={String(profile.session_duration || '45')} 
                    onValueChange={(val) => setProfile({ ...profile, session_duration: parseInt(val) })}
                  >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 Dakika</SelectItem>
                    <SelectItem value="30">30 Dakika</SelectItem>
                    <SelectItem value="45">45 Dakika</SelectItem>
                    <SelectItem value="60">60 Dakika (1 Saat)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" variant="outline">Ayarları Kaydet</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}