'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { HelpCircle, Send } from 'lucide-react'

export default function SupportPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Lütfen başlık ve mesaj alanlarını doldurun')
      setLoading(false)
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Destek talebi göndermek için giriş yapmalısınız')
        setLoading(false)
        return
      }

      const { error } = await supabase.from('support_tickets').insert({
        user_id: user.id,
        title: formData.title.trim(),
        message: formData.message.trim(),
        status: 'pending',
      })

      if (error) {
        console.error('Error creating support ticket:', error)
        toast.error('Destek talebi gönderilirken hata: ' + error.message)
        setLoading(false)
        return
      }

      toast.success('Destek talebiniz başarıyla iletildi.')
      // Reset form
      setFormData({
        title: '',
        message: '',
      })
      setLoading(false)
    } catch (error) {
      console.error('Exception creating support ticket:', error)
      toast.error('Destek talebi gönderilirken bir hata oluştu')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Destek & Geri Bildirim</h1>
        <p className="text-gray-600 mt-1">
          Sorularınız, önerileriniz veya sorunlarınız için bizimle iletişime geçin
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-6 h-6 text-blue-600" />
            <CardTitle>Destek Talebi Oluştur</CardTitle>
          </div>
          <CardDescription>
            Destek ekibimiz en kısa sürede size geri dönüş yapacaktır.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Başlık *</Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Sorununuzu kısaca özetleyin"
                className="text-base h-12"
                required
                maxLength={200}
              />
              <p className="text-xs text-gray-500">
                {formData.title.length}/200 karakter
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mesajınız *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Sorununuzu veya önerinizi detaylı bir şekilde açıklayın..."
                rows={8}
                className="text-base resize-none"
                required
                maxLength={2000}
              />
              <p className="text-xs text-gray-500">
                {formData.message.length}/2000 karakter
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Destek Talebi Gönder
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Bilgilendirme</h3>
              <p className="text-sm text-blue-800">
                Destek talebiniz alındıktan sonra en kısa sürede size geri dönüş yapılacaktır.
                Lütfen talebinizi gönderirken mümkün olduğunca detaylı bilgi verin.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


