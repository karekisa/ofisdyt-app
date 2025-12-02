'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    profession: '' as 'dietitian' | 'psychologist' | 'pt' | 'consultant' | '',
  })

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!formData.profession) {
      alert('Lütfen mesleğinizi seçin')
      setLoading(false)
      return
    }

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          profession: formData.profession,
        },
      },
    })

    if (authError) {
      alert('Kayıt hatası: ' + authError.message)
      setLoading(false)
      return
    }

    if (authData.user) {
      // Check if profile already exists (from trigger)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .single()

      if (!existingProfile) {
        // Create profile with profession if it doesn't exist
        const { error: profileError } = await supabase.from('profiles').insert({
          id: authData.user.id,
          full_name: formData.fullName,
          profession: formData.profession,
        })

        if (profileError) {
          alert('Profil oluşturulurken hata: ' + profileError.message)
          setLoading(false)
          return
        }
      } else {
        // Update existing profile with profession if it was created by trigger
        await supabase
          .from('profiles')
          .update({
            full_name: formData.fullName,
            profession: formData.profession,
          })
          .eq('id', authData.user.id)
      }

      // Set trial end date (15 days from now)
      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + 15)

      await supabase
        .from('profiles')
        .update({ trial_ends_at: trialEndsAt.toISOString() })
        .eq('id', authData.user.id)

      alert('Kayıt başarılı! Giriş yapabilirsiniz.')
      setIsSignUp(false)
      setFormData({ email: '', password: '', fullName: '', profession: '' })
    }

    setLoading(false)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    })

    if (error) {
      alert('Giriş hatası: ' + error.message)
    } else {
      router.push('/dashboard')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Diyetlik</h1>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            {isSignUp ? 'Hesap Oluştur' : "Diyetlik'e Hoşgeldiniz"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isSignUp
              ? 'Yeni hesap oluşturmak için bilgilerinizi girin'
              : 'Hesabınıza giriş yapın'}
          </p>
        </div>

        <form
          className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-sm border border-gray-200"
          onSubmit={isSignUp ? handleSignUp : handleSignIn}
        >
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ad Soyad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="Adınız ve soyadınız"
              />
            </div>
          )}

          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mesleğiniz <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.profession}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    profession: e.target.value as typeof formData.profession,
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              >
                <option value="">Meslek seçin</option>
                <option value="dietitian">Diyetisyen</option>
                <option value="psychologist">Psikolog / Terapist</option>
                <option value="pt">Spor Eğitmeni / PT</option>
                <option value="consultant">Diğer / Danışman</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-posta <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="ornek@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Şifre <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading
                ? 'İşleniyor...'
                : isSignUp
                  ? 'Hesap Oluştur'
                  : 'Giriş Yap'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setFormData({ email: '', password: '', fullName: '', profession: '' })
              }}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              {isSignUp
                ? 'Zaten hesabınız var mı? Giriş yapın'
                : 'Hesabınız yok mu? Kayıt olun'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
