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
import { Eye, ExternalLink, Link as LinkIcon } from 'lucide-react'
import { slugify } from '@/lib/utils'

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
      // Auto-generate slug from full_name if public_slug is empty
      let updatedSlug = profile.public_slug
      if (!updatedSlug && profile.full_name) {
        updatedSlug = slugify(profile.full_name)
        // Update local state with generated slug
        setProfile({ ...profile, public_slug: updatedSlug })
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          clinic_name: profile.clinic_name,
          phone: profile.phone,
          bio: profile.bio,
          website: profile.website,
          // Auto-save generated slug if it was created
          ...(updatedSlug && !profile.public_slug ? { public_slug: updatedSlug } : {}),
        })
        .eq('id', profile.id)

      if (error) throw error
      toast.success('Profil bilgileri güncellendi')
      
      // If slug was auto-generated, show a message
      if (updatedSlug && !profile.public_slug) {
        toast.info(`Randevu linkiniz otomatik oluşturuldu: ${updatedSlug}`)
      }
    } catch (error) {
      toast.error('Güncelleme başarısız oldu')
      console.error(error)
    }
  }

  const updateBookingConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    try {
      // CRITICAL: Auto-generate slug from full_name if empty
      let finalSlug = profile.public_slug
      if (!finalSlug && profile.full_name) {
        finalSlug = slugify(profile.full_name)
        toast.info(`Slug otomatik oluşturuldu: ${finalSlug}`)
      }

      // CRITICAL: Sanitize slug using slugify function
      // This ensures consistent slug format and prevents case-sensitivity issues
      const sanitizedSlug = finalSlug ? slugify(finalSlug) : null

      // Validate slug format (alphanumeric, hyphens, underscores only)
      if (sanitizedSlug && !/^[a-z0-9_-]+$/.test(sanitizedSlug)) {
        toast.error('Slug sadece küçük harf, rakam, tire (-) ve alt çizgi (_) içerebilir')
        return
      }

      // Check if slug is already taken by another user
      if (sanitizedSlug) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('public_slug', sanitizedSlug)
          .neq('id', profile.id) // Exclude current user
          .maybeSingle()

        if (existingUser) {
          toast.error('Bu randevu linki (slug) başkası tarafından kullanılıyor. Lütfen başka bir isim seçin.')
          return // STOP EXECUTION
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          public_slug: sanitizedSlug,
          work_start_hour: profile.work_start_hour,
          work_end_hour: profile.work_end_hour,
          session_duration: 30, // Fixed to 30 minutes globally
        })
        .eq('id', profile.id)

      if (error) throw error
      
      // Update local state with sanitized slug
      setProfile({ ...profile, public_slug: sanitizedSlug })
      
      toast.success('Randevu ayarları kaydedildi')
    } catch (error) {
      toast.error('Ayarlar kaydedilemedi')
      console.error(error)
    }
  }

  const handlePreviewBookingPage = () => {
    if (!profile?.public_slug) {
      toast.error('Lütfen önce bir slug belirleyin ve kaydedin')
      return
    }

    const publicUrl = `https://diyetlik.com.tr/randevu/${profile.public_slug}`
    window.open(publicUrl, '_blank', 'noopener,noreferrer')
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
                  onChange={(e) => {
                    const newFullName = e.target.value
                    // Auto-generate slug if public_slug is empty
                    let newSlug = profile.public_slug
                    if (!newSlug && newFullName) {
                      newSlug = slugify(newFullName)
                    }
                    setProfile({ 
                      ...profile, 
                      full_name: newFullName,
                      ...(newSlug && !profile.public_slug ? { public_slug: newSlug } : {})
                    })
                  }}
                  placeholder="Dr. Furkan Şahin"
                />
                {!profile.public_slug && profile.full_name && (
                  <p className="text-xs text-blue-600">
                    💡 Slug otomatik oluşturulacak: <code className="bg-blue-50 px-1 rounded">{slugify(profile.full_name)}</code>
                  </p>
                )}
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
                      <span className="text-gray-500 text-sm">diyetlik.com.tr/randevu/</span>
                      <Input 
                        value={profile.public_slug || ''} 
                        onChange={(e) => {
                          // Auto-sanitize on input using slugify function
                          const value = slugify(e.target.value)
                          setProfile({ ...profile, public_slug: value })
                        }}
                        placeholder={profile.full_name ? slugify(profile.full_name) : "ornek-slug"}
                        pattern="[a-z0-9_-]+"
                        title="Sadece küçük harf, rakam, tire (-) ve alt çizgi (_) kullanın"
                      />
                    </div>
                    {/* Live Preview of Generated Link */}
                    {(profile.public_slug || (profile.full_name && !profile.public_slug)) && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2 text-sm">
                          <LinkIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-green-700 font-medium mb-1">Randevu Linkiniz:</p>
                            <code className="text-xs text-green-900 break-all">
                              diyetlik.com.tr/randevu/{profile.public_slug || slugify(profile.full_name || '')}
                            </code>
                          </div>
                        </div>
                      </div>
                    )}
                    {!profile.public_slug && !profile.full_name && (
                      <p className="text-xs text-gray-500">
                        💡 Ad Soyad alanını doldurduğunuzda slug otomatik oluşturulacak
                      </p>
                    )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreviewBookingPage}
                  disabled={!profile.public_slug}
                  className="w-full mt-2"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Sayfayı Önizle
                </Button>
                {!profile.public_slug && (
                  <p className="text-xs text-gray-500 mt-1">
                    Önizleme için önce bir slug belirleyin ve kaydedin
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mesai Başlangıç</Label>
                  <Select 
                    value={profile.work_start_hour || '9'} 
                    onValueChange={(val) => setProfile({ ...profile, work_start_hour: val })}
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
                    value={profile.work_end_hour || '18'} 
                    onValueChange={(val) => setProfile({ ...profile, work_end_hour: val })}
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


              <Button type="submit" className="w-full" variant="outline">Ayarları Kaydet</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}