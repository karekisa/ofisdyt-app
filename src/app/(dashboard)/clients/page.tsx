'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Phone } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Client = {
  id: string
  name: string
  phone: string | null
  age: number | null
  gender: string | null
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClients(clients)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredClients(
        clients.filter(
          (client) =>
            client.name.toLowerCase().includes(query) ||
            client.phone?.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, clients])

  const loadClients = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    setUser(user)

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('dietitian_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading clients:', error)
    } else {
      setClients(data || [])
      setFilteredClients(data || [])
    }
    setLoading(false)
  }

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Danışanlar</h1>
          <p className="text-gray-600 mt-1">Danışanlarınızı yönetin</p>
        </div>
        <Link
          href="/clients/new"
          className="inline-flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors active:scale-95 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Yeni Danışan Ekle</span>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Danışan ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Clients List */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg">
            {searchQuery ? 'Danışan bulunamadı' : 'Henüz danışan yok'}
          </p>
          {!searchQuery && (
            <Link
              href="/clients/new"
              className="inline-flex items-center space-x-2 mt-4 text-green-600 hover:text-green-700 font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>İlk danışanınızı ekleyin</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Yaş
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cinsiyet
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/clients/${client.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-green-600"
                      >
                        {client.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {client.phone ? (
                        <a
                          href={`tel:${client.phone}`}
                          className="text-sm text-gray-600 hover:text-green-600 flex items-center space-x-1"
                        >
                          <Phone className="w-4 h-4" />
                          <span>{client.phone}</span>
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {client.age || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {client.gender || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/clients/${client.id}`}
                        className="text-green-600 hover:text-green-700"
                      >
                        Görüntüle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile FAB */}
      <Link
        href="/clients/new"
        className="lg:hidden fixed bottom-24 right-6 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-700 transition-colors active:scale-95 z-40"
        aria-label="Add client"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  )
}

