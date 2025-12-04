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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Profile, DietTemplate } from '@/lib/types'
import { Eye, ExternalLink, Link as LinkIcon, Plus, Trash2 } from 'lucide-react'
import { slugify } from '@/lib/utils'

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  // Diet Templates state
  type DayPlan = {
    breakfast: string
    lunch: string
    snack: string
    dinner: string
  }

  const DAYS = [
    { key: 'pazartesi', label: 'Pazartesi' },
    { key: 'sali', label: 'Salı' },
    { key: 'carsamba', label: 'Çarşamba' },
    { key: 'persembe', label: 'Perşembe' },
    { key: 'cuma', label: 'Cuma' },
    { key: 'cumartesi', label: 'Cumartesi' },
    { key: 'pazar', label: 'Pazar' },
  ]

  const EMPTY_DAY_PLAN: DayPlan = {
    breakfast: '',
    lunch: '',
    snack: '',
    dinner: '',
  }

  const [templates, setTemplates] = useState<DietTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<DietTemplate | null>(null)
  const [templateTitle, setTemplateTitle] = useState('')
  const [templateCategory, setTemplateCategory] = useState<'daily' | 'weekly'>('daily')
  const [dietPlan, setDietPlan] = useState<Record<string, DayPlan>>({
    pazartesi: { ...EMPTY_DAY_PLAN },
    sali: { ...EMPTY_DAY_PLAN },
    carsamba: { ...EMPTY_DAY_PLAN },
    persembe: { ...EMPTY_DAY_PLAN },
    cuma: { ...EMPTY_DAY_PLAN },
    cumartesi: { ...EMPTY_DAY_PLAN },
    pazar: { ...EMPTY_DAY_PLAN },
  })
  const [activeDay, setActiveDay] = useState('pazartesi')
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)

  useEffect(() => {
    fetchProfile()
    fetchTemplates()
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

  // Diet Templates functions
  const fetchTemplates = async () => {
    try {
      setTemplatesLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('diet_templates')
        .select('*')
        .eq('dietitian_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Şablonlar yüklenirken hata oluştu')
    } finally {
      setTemplatesLoading(false)
    }
  }

  // Parse content string into structured state
  const parseContentToState = (content: string, category: 'daily' | 'weekly') => {
    const upperContent = content.toUpperCase()
    const isWeekly = category === 'weekly' || ['PAZARTESİ', 'PAZARTESI', 'SALI', 'ÇARŞAMBA', 'CARSAMBA', 'PERŞEMBE', 'PERSEMBE', 'CUMA', 'CUMARTESİ', 'CUMARTESI', 'PAZAR'].some(
      keyword => upperContent.includes(keyword)
    )

    const newPlan: Record<string, DayPlan> = {
      pazartesi: { ...EMPTY_DAY_PLAN },
      sali: { ...EMPTY_DAY_PLAN },
      carsamba: { ...EMPTY_DAY_PLAN },
      persembe: { ...EMPTY_DAY_PLAN },
      cuma: { ...EMPTY_DAY_PLAN },
      cumartesi: { ...EMPTY_DAY_PLAN },
      pazar: { ...EMPTY_DAY_PLAN },
    }

    if (!isWeekly) {
      // Daily format - parse into pazartesi as generic day
      const lines = content.split('\n')
      let currentMeal: keyof DayPlan | null = null

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        const upper = trimmed.toUpperCase()
        
        if (upper.startsWith('KAHVALTI') || upper.startsWith('SABAH')) {
          currentMeal = 'breakfast'
          newPlan.pazartesi.breakfast = trimmed.replace(/^(KAHVALTI|SABAH):?\s*/i, '').trim()
        } else if (upper.startsWith('ÖĞLE') || upper.startsWith('ÖĞLEN')) {
          currentMeal = 'lunch'
          newPlan.pazartesi.lunch = trimmed.replace(/^(ÖĞLE|ÖĞLEN):?\s*/i, '').trim()
        } else if (upper.startsWith('ARA ÖĞÜN') || upper.startsWith('ARA ÖGÜN') || upper.startsWith('ATIŞTIRMALIK')) {
          currentMeal = 'snack'
          newPlan.pazartesi.snack = trimmed.replace(/^(ARA ÖĞÜN|ARA ÖGÜN|ATIŞTIRMALIK):?\s*/i, '').trim()
        } else if (upper.startsWith('AKŞAM') || upper.startsWith('AKSAM')) {
          currentMeal = 'dinner'
          newPlan.pazartesi.dinner = trimmed.replace(/^(AKŞAM|AKSAM):?\s*/i, '').trim()
        } else if (currentMeal) {
          newPlan.pazartesi[currentMeal] += (newPlan.pazartesi[currentMeal] ? '\n' : '') + trimmed
        }
      }
    } else {
      // Weekly format
      const lines = content.split('\n')
      const dayMap: Record<string, string> = {
        'PAZARTESİ': 'pazartesi',
        'PAZARTESI': 'pazartesi',
        'SALI': 'sali',
        'ÇARŞAMBA': 'carsamba',
        'CARSAMBA': 'carsamba',
        'PERŞEMBE': 'persembe',
        'PERSEMBE': 'persembe',
        'CUMA': 'cuma',
        'CUMARTESİ': 'cumartesi',
        'CUMARTESI': 'cumartesi',
        'PAZAR': 'pazar',
      }

      let currentDay: string | null = null
      let currentMeal: keyof DayPlan | null = null

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        const upper = trimmed.toUpperCase()

        // Check for day keyword
        const dayMatch = Object.keys(dayMap).find(keyword => upper.startsWith(keyword))
        if (dayMatch) {
          currentDay = dayMap[dayMatch]
          currentMeal = null
          continue
        }

        // Check for meal keyword
        if (upper.startsWith('KAHVALTI') || upper.startsWith('SABAH')) {
          currentMeal = 'breakfast'
          if (currentDay) {
            newPlan[currentDay].breakfast = trimmed.replace(/^(KAHVALTI|SABAH):?\s*/i, '').trim()
          }
        } else if (upper.startsWith('ÖĞLE') || upper.startsWith('ÖĞLEN')) {
          currentMeal = 'lunch'
          if (currentDay) {
            newPlan[currentDay].lunch = trimmed.replace(/^(ÖĞLE|ÖĞLEN):?\s*/i, '').trim()
          }
        } else if (upper.startsWith('ARA ÖĞÜN') || upper.startsWith('ARA ÖGÜN') || upper.startsWith('ATIŞTIRMALIK')) {
          currentMeal = 'snack'
          if (currentDay) {
            newPlan[currentDay].snack = trimmed.replace(/^(ARA ÖĞÜN|ARA ÖGÜN|ATIŞTIRMALIK):?\s*/i, '').trim()
          }
        } else if (upper.startsWith('AKŞAM') || upper.startsWith('AKSAM')) {
          currentMeal = 'dinner'
          if (currentDay) {
            newPlan[currentDay].dinner = trimmed.replace(/^(AKŞAM|AKSAM):?\s*/i, '').trim()
          }
        } else if (currentDay && currentMeal) {
          newPlan[currentDay][currentMeal] += (newPlan[currentDay][currentMeal] ? '\n' : '') + trimmed
        }
      }
    }

    setDietPlan(newPlan)
  }

  // Compile structured state back to text format
  const compileContent = (): string => {
    let content = ''

    if (templateCategory === 'weekly') {
      // Weekly format
      for (const day of DAYS) {
        const dayPlan = dietPlan[day.key]
        const hasContent = dayPlan.breakfast || dayPlan.lunch || dayPlan.snack || dayPlan.dinner

        if (hasContent) {
          content += `${day.label.toUpperCase()}\n`
          if (dayPlan.breakfast) content += `KAHVALTI: ${dayPlan.breakfast}\n`
          if (dayPlan.lunch) content += `ÖĞLE: ${dayPlan.lunch}\n`
          if (dayPlan.snack) content += `ARA ÖĞÜN: ${dayPlan.snack}\n`
          if (dayPlan.dinner) content += `AKŞAM: ${dayPlan.dinner}\n`
          content += '\n'
        }
      }
    } else {
      // Daily format (use pazartesi as generic day)
      const dayPlan = dietPlan.pazartesi
      if (dayPlan.breakfast) content += `KAHVALTI: ${dayPlan.breakfast}\n`
      if (dayPlan.lunch) content += `ÖĞLE: ${dayPlan.lunch}\n`
      if (dayPlan.snack) content += `ARA ÖĞÜN: ${dayPlan.snack}\n`
      if (dayPlan.dinner) content += `AKŞAM: ${dayPlan.dinner}\n`
    }

    return content.trim()
  }

  const handleNewTemplate = () => {
    setSelectedTemplate(null)
    setTemplateTitle('')
    setTemplateCategory('daily')
    setDietPlan({
      pazartesi: { ...EMPTY_DAY_PLAN },
      sali: { ...EMPTY_DAY_PLAN },
      carsamba: { ...EMPTY_DAY_PLAN },
      persembe: { ...EMPTY_DAY_PLAN },
      cuma: { ...EMPTY_DAY_PLAN },
      cumartesi: { ...EMPTY_DAY_PLAN },
      pazar: { ...EMPTY_DAY_PLAN },
    })
    setActiveDay('pazartesi')
  }

  const handleSelectTemplate = (template: DietTemplate) => {
    setSelectedTemplate(template)
    setTemplateTitle(template.title)
    setTemplateCategory(template.category)
    parseContentToState(template.content, template.category)
    setActiveDay('pazartesi')
  }

  const updateDayPlan = (day: string, meal: keyof DayPlan, value: string) => {
    setDietPlan(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [meal]: value,
      },
    }))
  }

  const handleSaveTemplate = async () => {
    if (!templateTitle.trim()) {
      toast.error('Lütfen şablon adı girin')
      return
    }

    const compiledContent = compileContent()
    if (!compiledContent.trim()) {
      toast.error('Lütfen en az bir öğün için içerik girin')
      return
    }

    try {
      setSavingTemplate(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Kullanıcı bilgisi bulunamadı')
        return
      }

      if (selectedTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('diet_templates')
          .update({
            title: templateTitle.trim(),
            content: compiledContent,
            category: templateCategory,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedTemplate.id)
          .eq('dietitian_id', user.id)

        if (error) throw error
        toast.success('Şablon güncellendi')
      } else {
        // Insert new template
        const { data, error } = await supabase
          .from('diet_templates')
          .insert({
            dietitian_id: user.id,
            title: templateTitle.trim(),
            content: compiledContent,
            category: templateCategory,
          })
          .select()
          .single()

        if (error) throw error
        toast.success('Şablon kaydedildi')
        setSelectedTemplate(data)
      }

      await fetchTemplates()
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Şablon kaydedilirken hata oluştu')
    } finally {
      setSavingTemplate(false)
    }
  }

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return

    if (!confirm('Bu şablonu silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('diet_templates')
        .delete()
        .eq('id', selectedTemplate.id)
        .eq('dietitian_id', user.id)

      if (error) throw error
      toast.success('Şablon silindi')
      
      setSelectedTemplate(null)
      setTemplateTitle('')
      setTemplateCategory('daily')
      setDietPlan({
        pazartesi: { ...EMPTY_DAY_PLAN },
        sali: { ...EMPTY_DAY_PLAN },
        carsamba: { ...EMPTY_DAY_PLAN },
        persembe: { ...EMPTY_DAY_PLAN },
        cuma: { ...EMPTY_DAY_PLAN },
        cumartesi: { ...EMPTY_DAY_PLAN },
        pazar: { ...EMPTY_DAY_PLAN },
      })
      setActiveDay('pazartesi')
      await fetchTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Şablon silinirken hata oluştu')
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

      {/* KART 3: DIYET ŞABLONLARIM */}
      <Card>
        <CardHeader>
          <CardTitle>Diyet Şablonlarım</CardTitle>
          <CardDescription>Yeniden kullanılabilir diyet planı şablonları oluşturun ve yönetin.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side: Template List */}
            <div className="space-y-4">
              <Button
                type="button"
                onClick={handleNewTemplate}
                className="w-full"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Yeni Şablon Ekle
              </Button>
              
              {templatesLoading ? (
                <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Henüz şablon eklenmemiş. Yeni şablon eklemek için yukarıdaki butona tıklayın.
                </div>
              ) : (
                <div className="border rounded-lg max-h-[500px] overflow-y-auto">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedTemplate?.id === template.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{template.title}</h3>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            template.category === 'daily'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {template.category === 'daily' ? 'Günlük' : 'Haftalık'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(template.created_at).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Side: Template Editor */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Şablon Adı</Label>
                <Input
                  value={templateTitle}
                  onChange={(e) => setTemplateTitle(e.target.value)}
                  placeholder="Örn: Kilo Verme Programı"
                />
              </div>

              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={templateCategory}
                  onValueChange={(value) => {
                    setTemplateCategory(value as 'daily' | 'weekly')
                    if (value === 'daily') {
                      setActiveDay('pazartesi')
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Günlük Liste</SelectItem>
                    <SelectItem value="weekly">Haftalık Program</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Structured Diet Builder */}
              {templateCategory === 'weekly' ? (
                <div className="space-y-4">
                  <Label>Haftalık Program</Label>
                  <Tabs value={activeDay} onValueChange={setActiveDay}>
                    <TabsList className="w-full overflow-x-auto justify-start">
                      {DAYS.map((day) => (
                        <TabsTrigger key={day.key} value={day.key}>
                          {day.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {DAYS.map((day) => (
                      <TabsContent key={day.key} value={day.key} className="mt-4">
                        <div className="space-y-4">
                          {/* Breakfast */}
                          <div>
                            <Label className="flex items-center gap-2 mb-2">
                              <span className="text-xl">🍳</span>
                              <span>Kahvaltı</span>
                            </Label>
                            <Textarea
                              value={dietPlan[day.key].breakfast}
                              onChange={(e) => updateDayPlan(day.key, 'breakfast', e.target.value)}
                              placeholder="Kahvaltı menüsü..."
                              className="min-h-[80px] bg-yellow-50/50 border-yellow-200"
                            />
                          </div>

                          {/* Lunch */}
                          <div>
                            <Label className="flex items-center gap-2 mb-2">
                              <span className="text-xl">🥗</span>
                              <span>Öğle Yemeği</span>
                            </Label>
                            <Textarea
                              value={dietPlan[day.key].lunch}
                              onChange={(e) => updateDayPlan(day.key, 'lunch', e.target.value)}
                              placeholder="Öğle yemeği menüsü..."
                              className="min-h-[80px] bg-green-50/50 border-green-200"
                            />
                          </div>

                          {/* Snack */}
                          <div>
                            <Label className="flex items-center gap-2 mb-2">
                              <span className="text-xl">🍎</span>
                              <span>Ara Öğünler</span>
                            </Label>
                            <Textarea
                              value={dietPlan[day.key].snack}
                              onChange={(e) => updateDayPlan(day.key, 'snack', e.target.value)}
                              placeholder="Ara öğün seçenekleri..."
                              className="min-h-[80px] bg-orange-50/50 border-orange-200"
                            />
                          </div>

                          {/* Dinner */}
                          <div>
                            <Label className="flex items-center gap-2 mb-2">
                              <span className="text-xl">🌙</span>
                              <span>Akşam Yemeği</span>
                            </Label>
                            <Textarea
                              value={dietPlan[day.key].dinner}
                              onChange={(e) => updateDayPlan(day.key, 'dinner', e.target.value)}
                              placeholder="Akşam yemeği menüsü..."
                              className="min-h-[80px] bg-blue-50/50 border-blue-200"
                            />
                          </div>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              ) : (
                // Daily format - single day
                <div className="space-y-4">
                  <Label>Genel / Günlük Liste</Label>
                  <div className="space-y-4">
                    {/* Breakfast */}
                    <div>
                      <Label className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🍳</span>
                        <span>Kahvaltı</span>
                      </Label>
                      <Textarea
                        value={dietPlan.pazartesi.breakfast}
                        onChange={(e) => updateDayPlan('pazartesi', 'breakfast', e.target.value)}
                        placeholder="Kahvaltı menüsü..."
                        className="min-h-[80px] bg-yellow-50/50 border-yellow-200"
                      />
                    </div>

                    {/* Lunch */}
                    <div>
                      <Label className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🥗</span>
                        <span>Öğle Yemeği</span>
                      </Label>
                      <Textarea
                        value={dietPlan.pazartesi.lunch}
                        onChange={(e) => updateDayPlan('pazartesi', 'lunch', e.target.value)}
                        placeholder="Öğle yemeği menüsü..."
                        className="min-h-[80px] bg-green-50/50 border-green-200"
                      />
                    </div>

                    {/* Snack */}
                    <div>
                      <Label className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🍎</span>
                        <span>Ara Öğünler</span>
                      </Label>
                      <Textarea
                        value={dietPlan.pazartesi.snack}
                        onChange={(e) => updateDayPlan('pazartesi', 'snack', e.target.value)}
                        placeholder="Ara öğün seçenekleri..."
                        className="min-h-[80px] bg-orange-50/50 border-orange-200"
                      />
                    </div>

                    {/* Dinner */}
                    <div>
                      <Label className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🌙</span>
                        <span>Akşam Yemeği</span>
                      </Label>
                      <Textarea
                        value={dietPlan.pazartesi.dinner}
                        onChange={(e) => updateDayPlan('pazartesi', 'dinner', e.target.value)}
                        placeholder="Akşam yemeği menüsü..."
                        className="min-h-[80px] bg-blue-50/50 border-blue-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleSaveTemplate}
                  disabled={savingTemplate || !templateTitle.trim()}
                  className="flex-1"
                >
                  {savingTemplate ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
                <Button
                  type="button"
                  onClick={handleDeleteTemplate}
                  disabled={!selectedTemplate || savingTemplate}
                  variant="destructive"
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Sil
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}