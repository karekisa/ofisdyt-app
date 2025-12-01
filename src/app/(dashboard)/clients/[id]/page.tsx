'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Phone, MessageCircle, Pencil } from 'lucide-react'
import Link from 'next/link'
import ClientTabs from './ClientTabs'
import EditClientDialog from './EditClientDialog'
import { formatPhoneForWhatsapp } from '@/lib/utils'

type Client = {
  id: string
  name: string
  phone: string | null
  age: number | null
  height: number | null
  gender: string | null
  notes: string | null
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'measurements' | 'progress' | 'dietlists'>('info')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    loadClient()
  }, [params.id])

  const loadClient = async () => {
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
      .eq('id', params.id)
      .eq('dietitian_id', user.id)
      .single()

    if (error || !data) {
      router.push('/clients')
      return
    }

    setClient(data)
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

  if (!client) {
    return null
  }

  const formattedPhone = formatPhoneForWhatsapp(client.phone)
  const whatsappUrl = formattedPhone ? `https://wa.me/${formattedPhone}` : null

  const handleEditSuccess = () => {
    loadClient()
    setIsEditDialogOpen(false)
    router.refresh()
  }

  const handleDeleteClient = async () => {
    if (!client) return

    // Cascade delete: Delete related data first
    const clientId = client.id

    // Step A: Delete measurements
    const { error: measurementsError } = await supabase
      .from('measurements')
      .delete()
      .eq('client_id', clientId)

    if (measurementsError) {
      alert('Ölçümler silinirken hata: ' + measurementsError.message)
      return
    }

    // Step B: Delete appointments
    const { error: appointmentsError } = await supabase
      .from('appointments')
      .delete()
      .eq('client_id', clientId)

    if (appointmentsError) {
      alert('Randevular silinirken hata: ' + appointmentsError.message)
      return
    }

    // Step C: Delete diet lists
    const { error: dietListsError } = await supabase
      .from('diet_lists')
      .delete()
      .eq('client_id', clientId)

    if (dietListsError) {
      alert('Diyet listeleri silinirken hata: ' + dietListsError.message)
      return
    }

    // Step D: Finally, delete the client
    const { error: clientError } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)

    if (clientError) {
      alert('Danışan silinirken hata: ' + clientError.message)
      return
    }

    // Success: Redirect to clients list
    alert('Danışan ve tüm verileri silindi.')
    router.push('/clients')
  }

  return (
    <div className="space-y-6">
      <Link
        href="/clients"
        className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Danışanlara Dön</span>
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
              <button
                onClick={() => setIsEditDialogOpen(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Düzenle"
                title="Danışan bilgilerini düzenle"
              >
                <Pencil className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
              {client.age && <span>Yaş: {client.age}</span>}
              {client.height && <span>Boy: {client.height} cm</span>}
              {client.gender && <span>Cinsiyet: {client.gender === 'male' ? 'Erkek' : client.gender === 'female' ? 'Kadın' : 'Diğer'}</span>}
            </div>
          </div>
          <div className="flex space-x-3">
            {client.phone && (
              <>
                <a
                  href={`tel:${client.phone}`}
                  className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  <span>Ara</span>
                </a>
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ClientTabs clientId={client.id} activeTab={activeTab} setActiveTab={setActiveTab} client={client} />

      {/* Edit Client Dialog */}
      {client && (
        <EditClientDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSuccess={handleEditSuccess}
          onDelete={handleDeleteClient}
          client={client}
        />
      )}
    </div>
  )
}

