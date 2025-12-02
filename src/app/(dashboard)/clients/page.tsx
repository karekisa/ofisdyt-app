'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Plus, User, Phone, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

type Client = {
  id: string
  name: string
  phone: string | null
  age: number | null
  height: number | null
  gender: string | null
  notes: string | null
  created_at: string
}

export default function ClientsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('dietitian_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading clients:', error)
      alert('Danışanlar yüklenirken hata: ' + error.message)
    } else {
      setClients((data as Client[]) || [])
    }

    setLoading(false)
  }

  // Filter clients based on search term
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients

    const term = searchTerm.toLowerCase()
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(term) ||
        client.phone?.toLowerCase().includes(term) ||
        client.notes?.toLowerCase().includes(term)
    )
  }, [clients, searchTerm])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Danışanlar</h1>
          <p className="text-gray-600 mt-1">Danışanlarınızı yönetin</p>
        </div>
        <Link
          href="/clients/new"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Yeni Danışan Ekle</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Danışan ara (ad, telefon, notlar)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <span className="text-sm">Temizle</span>
            </button>
          )}
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          {searchTerm ? (
            <>
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium mb-2">
                Arama sonucu bulunamadı
              </p>
              <p className="text-gray-500 text-sm">
                "{searchTerm}" için eşleşen danışan bulunamadı.
              </p>
            </>
          ) : (
            <>
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium mb-2">
                Henüz danışan eklenmemiş
              </p>
              <p className="text-gray-500 text-sm mb-6">
                İlk danışanınızı ekleyerek başlayın.
              </p>
              <Link
                href="/clients/new"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                <span>Yeni Danışan Ekle</span>
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all hover:border-green-300 active:scale-[0.98]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {client.name}
                  </h3>
                  {client.age && (
                    <p className="text-sm text-gray-500 mt-1">
                      {client.age} yaş
                      {client.gender &&
                        ` • ${
                          client.gender === 'male'
                            ? 'Erkek'
                            : client.gender === 'female'
                              ? 'Kadın'
                              : 'Diğer'
                        }`}
                    </p>
                  )}
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
                  <User className="w-5 h-5 text-green-600" />
                </div>
              </div>

              <div className="space-y-2">
                {client.phone && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{client.phone}</span>
                  </div>
                )}

                {client.height && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span className="w-4 h-4 flex-shrink-0"></span>
                    <span>Boy: {client.height} cm</span>
                  </div>
                )}

                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {format(new Date(client.created_at), 'd MMMM yyyy', {
                      locale: tr,
                    })}
                  </span>
                </div>

                {client.notes && (
                  <p className="text-sm text-gray-600 line-clamp-2 mt-3 pt-3 border-t border-gray-100">
                    {client.notes}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Results Count */}
      {searchTerm && filteredClients.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          {filteredClients.length} danışan bulundu
        </div>
      )}
    </div>
  )
}
