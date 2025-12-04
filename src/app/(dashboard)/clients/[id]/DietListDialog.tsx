'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { DietTemplate } from '@/lib/types'

type DietList = {
  id: string
  title: string
  content: string
}

type DayPlan = {
  breakfast: string
  lunch: string
  snack: string
  dinner: string
}

type DietListDialogProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  clientId: string
  clientName: string
  clientPhone: string | null
  editingList: DietList | null
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

export default function DietListDialog({
  isOpen,
  onClose,
  onSuccess,
  clientId,
  clientName,
  clientPhone,
  editingList,
}: DietListDialogProps) {
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<DietTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [title, setTitle] = useState('')
  const [generalNotes, setGeneralNotes] = useState('')
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
  const [isWeekly, setIsWeekly] = useState(true)

  useEffect(() => {
    if (isOpen && !editingList) {
      fetchTemplates()
      resetForm()
    }
  }, [isOpen, editingList])

  useEffect(() => {
    if (editingList) {
      setTitle(editingList.title)
      parseContentToState(editingList.content)
      setSelectedTemplateId('')
    } else {
      resetForm()
    }
  }, [editingList, isOpen])

  const resetForm = () => {
    setTitle('')
    setGeneralNotes('')
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
    setIsWeekly(true)
  }

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
    } finally {
      setTemplatesLoading(false)
    }
  }

  // Parse template/content string into structured state
  const parseContentToState = (content: string) => {
    const upperContent = content.toUpperCase()
    const hasWeeklyKeywords = ['PAZARTESİ', 'PAZARTESI', 'SALI', 'ÇARŞAMBA', 'CARSAMBA', 'PERŞEMBE', 'PERSEMBE', 'CUMA', 'CUMARTESİ', 'CUMARTESI', 'PAZAR'].some(
      keyword => upperContent.includes(keyword)
    )

    setIsWeekly(hasWeeklyKeywords)

    // Extract general notes (before first day keyword)
    const dayKeywords = ['PAZARTESİ', 'PAZARTESI', 'SALI', 'ÇARŞAMBA', 'CARSAMBA', 'PERŞEMBE', 'PERSEMBE', 'CUMA', 'CUMARTESİ', 'CUMARTESI', 'PAZAR']
    const firstDayIndex = content.split('\n').findIndex(line => 
      dayKeywords.some(keyword => line.toUpperCase().trim().startsWith(keyword))
    )

    if (firstDayIndex > 0) {
      const notesLines = content.split('\n').slice(0, firstDayIndex)
      setGeneralNotes(notesLines.join('\n').replace(/^GENEL NOTLAR?:?\s*/i, '').trim())
    } else {
      // If no day keywords, treat as daily
      if (!hasWeeklyKeywords) {
        setIsWeekly(false)
        // Try to parse as daily format
        const lines = content.split('\n')
        const dailyPlan: DayPlan = { ...EMPTY_DAY_PLAN }
        let currentMeal: keyof DayPlan | null = null

        for (const line of lines) {
          const trimmed = line.trim()
          const upper = trimmed.toUpperCase()
          
          if (upper.startsWith('KAHVALTI') || upper.startsWith('SABAH')) {
            currentMeal = 'breakfast'
            dailyPlan.breakfast = trimmed.replace(/^(KAHVALTI|SABAH):?\s*/i, '').trim()
          } else if (upper.startsWith('ÖĞLE') || upper.startsWith('ÖĞLEN')) {
            currentMeal = 'lunch'
            dailyPlan.lunch = trimmed.replace(/^(ÖĞLE|ÖĞLEN):?\s*/i, '').trim()
          } else if (upper.startsWith('ARA ÖĞÜN') || upper.startsWith('ARA ÖGÜN') || upper.startsWith('ATIŞTIRMALIK')) {
            currentMeal = 'snack'
            dailyPlan.snack = trimmed.replace(/^(ARA ÖĞÜN|ARA ÖGÜN|ATIŞTIRMALIK):?\s*/i, '').trim()
          } else if (upper.startsWith('AKŞAM') || upper.startsWith('AKSAM')) {
            currentMeal = 'dinner'
            dailyPlan.dinner = trimmed.replace(/^(AKŞAM|AKSAM):?\s*/i, '').trim()
          } else if (currentMeal && trimmed) {
            dailyPlan[currentMeal] += (dailyPlan[currentMeal] ? '\n' : '') + trimmed
          } else if (!currentMeal && trimmed) {
            setGeneralNotes(prev => prev ? prev + '\n' + trimmed : trimmed)
          }
        }

        setDietPlan({
          pazartesi: dailyPlan,
          sali: { ...EMPTY_DAY_PLAN },
          carsamba: { ...EMPTY_DAY_PLAN },
          persembe: { ...EMPTY_DAY_PLAN },
          cuma: { ...EMPTY_DAY_PLAN },
          cumartesi: { ...EMPTY_DAY_PLAN },
          pazar: { ...EMPTY_DAY_PLAN },
        })
        return
      }
    }

    // Parse weekly format
    const lines = content.split('\n')
    const newPlan: Record<string, DayPlan> = {
      pazartesi: { ...EMPTY_DAY_PLAN },
      sali: { ...EMPTY_DAY_PLAN },
      carsamba: { ...EMPTY_DAY_PLAN },
      persembe: { ...EMPTY_DAY_PLAN },
      cuma: { ...EMPTY_DAY_PLAN },
      cumartesi: { ...EMPTY_DAY_PLAN },
      pazar: { ...EMPTY_DAY_PLAN },
    }

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
        // Append to current meal
        newPlan[currentDay][currentMeal] += (newPlan[currentDay][currentMeal] ? '\n' : '') + trimmed
      }
    }

    setDietPlan(newPlan)
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId)
    if (templateId) {
      const template = templates.find((t) => t.id === templateId)
      if (template) {
        setTitle(template.title)
        parseContentToState(template.content)
        setIsWeekly(template.category === 'weekly')
      }
    } else {
      resetForm()
    }
  }

  // Compile structured state back to text format
  const compileContent = (): string => {
    let content = ''

    // Add general notes
    if (generalNotes.trim()) {
      content += `GENEL NOTLAR: ${generalNotes.trim()}\n\n`
    }

    if (isWeekly) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      alert('Lütfen başlık girin')
      return
    }

    const compiledContent = compileContent()
    if (!compiledContent.trim()) {
      alert('Lütfen en az bir öğün için içerik girin')
      return
    }

    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert('Oturum açmanız gerekiyor')
      setLoading(false)
      return
    }

    if (editingList) {
      // Update existing list
      const { error } = await supabase
        .from('diet_lists')
        .update({
          title: title.trim(),
          content: compiledContent,
        })
        .eq('id', editingList.id)

      if (error) {
        alert('Güncellenirken hata: ' + error.message)
      } else {
        onSuccess()
      }
    } else {
      // Create new list
      const { error } = await supabase.from('diet_lists').insert({
        dietitian_id: user.id,
        client_id: clientId,
        title: title.trim(),
        content: compiledContent,
      })

      if (error) {
        alert('Oluşturulurken hata: ' + error.message)
      } else {
        onSuccess()
      }
    }

    setLoading(false)
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingList ? 'Listeyi Düzenle' : 'Yeni Liste Oluştur'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {!editingList && (
              <div>
                <Label className="mb-2">Şablondan Yükle</Label>
                <Select
                  value={selectedTemplateId}
                  onValueChange={handleTemplateSelect}
                >
                  <SelectTrigger disabled={templatesLoading}>
                    <SelectValue placeholder={templatesLoading ? 'Yükleniyor...' : 'Şablon seçin (isteğe bağlı)'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Yeni liste oluştur</SelectItem>
                    
                    {/* Daily Templates Group */}
                    {templates.filter(t => t.category === 'daily').length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 border-b border-gray-200 bg-gray-50">
                          --- Günlük Listeler ---
                        </div>
                        {templates
                          .filter(t => t.category === 'daily')
                          .map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.title}
                            </SelectItem>
                          ))}
                      </>
                    )}
                    
                    {/* Weekly Templates Group */}
                    {templates.filter(t => t.category === 'weekly').length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 border-b border-gray-200 bg-gray-50 mt-1">
                          --- Haftalık Programlar ---
                        </div>
                        {templates
                          .filter(t => t.category === 'weekly')
                          .map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.title}
                            </SelectItem>
                          ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                {templates.length === 0 && !templatesLoading && (
                  <p className="text-xs text-gray-500 mt-1">
                    Henüz şablon eklenmemiş. Ayarlar sayfasından şablon oluşturabilirsiniz.
                  </p>
                )}
              </div>
            )}

            <div>
              <Label>
                Başlık <span className="text-red-500">*</span>
              </Label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none mt-2"
                placeholder="Liste başlığı"
              />
            </div>

            {/* General Notes */}
            <div>
              <Label>Notlar / Genel Tavsiyeler</Label>
              <Textarea
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                placeholder="Genel notlar, tavsiyeler veya özel durumlar..."
                className="mt-2 min-h-[80px]"
              />
            </div>

            {/* Day Tabs */}
            {isWeekly ? (
              <div>
                <Label className="mb-3 block">Haftalık Program</Label>
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
                            className="min-h-[100px] bg-yellow-50/50 border-yellow-200"
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
                            className="min-h-[100px] bg-green-50/50 border-green-200"
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
                            className="min-h-[100px] bg-orange-50/50 border-orange-200"
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
                            className="min-h-[100px] bg-blue-50/50 border-blue-200"
                          />
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            ) : (
              // Daily format - single day
              <div>
                <Label className="mb-3 block">Günlük Liste</Label>
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
                      className="min-h-[100px] bg-yellow-50/50 border-yellow-200"
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
                      className="min-h-[100px] bg-green-50/50 border-green-200"
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
                      className="min-h-[100px] bg-orange-50/50 border-orange-200"
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
                      className="min-h-[100px] bg-blue-50/50 border-blue-200"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex space-x-4 p-6 border-t border-gray-200 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center font-medium"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading
                ? 'Kaydediliyor...'
                : editingList
                  ? 'Güncelle'
                  : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
