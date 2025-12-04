'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import { SupportTicket, SupportTicketStatus } from '@/lib/types'
import { toast } from 'sonner'
import { HelpCircle, CheckCircle, Clock, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function SupportTicketsAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAdminAndLoadTickets()
  }, [])

  const checkAdminAndLoadTickets = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!profile?.is_admin) {
        toast.error('Bu sayfaya erişim yetkiniz yok')
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
      await loadTickets()
    } catch (error) {
      console.error('Error checking admin status:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(
          `
          *,
          profiles:user_id (
            id,
            full_name
          )
        `
        )
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading tickets:', error)
        toast.error('Destek talepleri yüklenirken hata: ' + error.message)
        return
      }

      setTickets((data as SupportTicket[]) || [])
    } catch (error) {
      console.error('Exception loading tickets:', error)
      toast.error('Destek talepleri yüklenirken bir hata oluştu')
    }
  }

  const updateTicketStatus = async (ticketId: string, newStatus: SupportTicketStatus) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: newStatus })
        .eq('id', ticketId)

      if (error) {
        console.error('Error updating ticket status:', error)
        toast.error('Durum güncellenirken hata: ' + error.message)
        return
      }

      toast.success('Destek talebi durumu güncellendi')
      await loadTickets()
    } catch (error) {
      console.error('Exception updating ticket status:', error)
      toast.error('Durum güncellenirken bir hata oluştu')
    }
  }

  const getStatusColor = (status: SupportTicketStatus) => {
    switch (status) {
      case 'solved':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusIcon = (status: SupportTicketStatus) => {
    switch (status) {
      case 'solved':
        return <CheckCircle className="w-4 h-4" />
      case 'in_progress':
        return <Clock className="w-4 h-4" />
      case 'pending':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <HelpCircle className="w-4 h-4" />
    }
  }

  const getStatusLabel = (status: SupportTicketStatus) => {
    switch (status) {
      case 'solved':
        return 'Çözüldü'
      case 'in_progress':
        return 'İşlemde'
      case 'pending':
        return 'Beklemede'
      default:
        return status
    }
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

  if (!isAdmin) {
    return null
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Admin Paneline Dön</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Destek Talepleri</h1>
          <p className="text-gray-600 mt-1">Tüm kullanıcı destek taleplerini yönetin</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bekleyen</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {tickets.filter((t) => t.status === 'pending').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">İşlemde</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {tickets.filter((t) => t.status === 'in_progress').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Çözülen</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {tickets.filter((t) => t.status === 'solved').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Destek Talepleri Listesi</CardTitle>
          <CardDescription>
            Toplam {tickets.length} adet destek talebi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium mb-2">
                Henüz destek talebi bulunmuyor
              </p>
              <p className="text-gray-400 text-sm">
                Kullanıcılar destek talebi oluşturduğunda burada görünecektir.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Başlık
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Kullanıcı
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Durum
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Oluşturulma Tarihi
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="max-w-xs">
                          <p className="font-medium text-gray-900 truncate">{ticket.title}</p>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {ticket.message}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-900">
                          {ticket.profiles?.full_name || 'Bilinmeyen Kullanıcı'}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            ticket.status
                          )}`}
                        >
                          {getStatusIcon(ticket.status)}
                          <span>{getStatusLabel(ticket.status)}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-600">
                          {format(parseISO(ticket.created_at), 'd MMMM yyyy, HH:mm', {
                            locale: tr,
                          })}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          {ticket.status !== 'solved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateTicketStatus(ticket.id, 'solved')}
                              className="text-green-600 hover:bg-green-50 border-green-200"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Çözüldü
                            </Button>
                          )}
                          {ticket.status !== 'in_progress' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateTicketStatus(ticket.id, 'in_progress')}
                              className="text-blue-600 hover:bg-blue-50 border-blue-200"
                            >
                              <Clock className="w-4 h-4 mr-1" />
                              İşlemde
                            </Button>
                          )}
                          {ticket.status !== 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateTicketStatus(ticket.id, 'pending')}
                              className="text-yellow-600 hover:bg-yellow-50 border-yellow-200"
                            >
                              <AlertCircle className="w-4 h-4 mr-1" />
                              Beklemede
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}




