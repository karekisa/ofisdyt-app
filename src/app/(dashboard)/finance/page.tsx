'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2 } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import AddTransactionDialog from './AddTransactionDialog'

type Transaction = {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string | null
  payment_method: 'cash' | 'credit_card' | 'transfer'
  transaction_date: string
  client_id: string | null
  clients?: { name: string } | null
}

const INCOME_CATEGORIES = ['Seans Ücreti', 'Danışmanlık', 'Diğer']
const EXPENSE_CATEGORIES = ['Kira', 'Fatura', 'Aidat', 'Yemek', 'Diğer']
const PAYMENT_METHODS = [
  { value: 'cash', label: 'Nakit' },
  { value: 'credit_card', label: 'Kredi Kartı' },
  { value: 'transfer', label: 'Havale/EFT' },
]

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(amount)
}

export default function FinancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadTransactions()
    }
  }, [user, selectedDate])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    setUser(user)
  }

  const loadTransactions = async () => {
    if (!user) return

    setLoading(true)
    const monthStart = startOfMonth(selectedDate)
    const monthEnd = endOfMonth(selectedDate)

    const { data, error } = await supabase
      .from('transactions')
      .select(
        `
        *,
        clients:client_id (
          name
        )
      `
      )
      .eq('dietitian_id', user.id)
      .gte('transaction_date', format(monthStart, 'yyyy-MM-dd'))
      .lte('transaction_date', format(monthEnd, 'yyyy-MM-dd'))
      .order('transaction_date', { ascending: false })

    if (!error && data) {
      setTransactions(data as Transaction[])

      // Calculate stats
      const income = data
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0)
      const expense = data
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      setStats({
        totalIncome: income,
        totalExpense: expense,
        netProfit: income - expense,
      })
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu işlemi silmek istediğinize emin misiniz?')) {
      return
    }

    const { error } = await supabase.from('transactions').delete().eq('id', id)

    if (!error) {
      loadTransactions()
    }
  }

  // Prepare chart data
  const chartData = (() => {
    const days = eachDayOfInterval({
      start: startOfMonth(selectedDate),
      end: endOfMonth(selectedDate),
    })

    return days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd')
      const dayTransactions = transactions.filter(
        (t) => t.transaction_date === dayStr
      )

      const income = dayTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0)
      const expense = dayTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      return {
        day: format(day, 'd'),
        date: dayStr,
        income,
        expense,
      }
    })
  })()

  const handlePreviousMonth = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() - 1)
      return newDate
    })
  }

  const handleNextMonth = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + 1)
      return newDate
    })
  }

  const handleToday = () => {
    setSelectedDate(new Date())
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finans Yönetimi</h1>
          <p className="text-gray-600 mt-1">Gelir ve gider takibi</p>
        </div>

        {/* Month/Year Filter */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ←
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleToday}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Bugün
            </button>
            <input
              type="month"
              value={format(selectedDate, 'yyyy-MM')}
              onChange={(e) => {
                const [year, month] = e.target.value.split('-')
                setSelectedDate(new Date(parseInt(year), parseInt(month) - 1))
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            →
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Toplam Gelir</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {formatCurrency(stats.totalIncome)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Toplam Gider</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {formatCurrency(stats.totalExpense)}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Kazanç</p>
              <p
                className={`text-3xl font-bold mt-2 ${
                  stats.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(stats.netProfit)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Günlük Gelir & Gider Grafiği
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label) => {
                const dayData = chartData.find((d) => d.day === label)
                return dayData
                  ? format(parseISO(dayData.date), 'd MMMM', { locale: tr })
                  : label
              }}
            />
            <Legend />
            <Bar dataKey="income" fill="#22c55e" name="Gelir" />
            <Bar dataKey="expense" fill="#ef4444" name="Gider" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">İşlemler</h2>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni İşlem Ekle</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Açıklama
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tür
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tutar
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ödeme Yöntemi
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 md:px-6 py-8 text-center text-xs md:text-sm text-gray-500">
                    Bu ay için işlem bulunmuyor
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                      {format(parseISO(transaction.transaction_date), 'd MMMM yyyy', {
                        locale: tr,
                      })}
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                      {transaction.category}
                    </td>
                    <td className="px-3 md:px-6 py-4 text-xs md:text-sm text-gray-900">
                      {transaction.description || '-'}
                      {transaction.clients && (
                        <span className="text-xs text-gray-500 ml-2">
                          ({transaction.clients.name})
                        </span>
                      )}
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          transaction.type === 'income'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {transaction.type === 'income' ? 'Gelir' : 'Gider'}
                      </span>
                    </td>
                    <td
                      className={`px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm font-semibold ${
                        transaction.type === 'income'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(Number(transaction.amount))}
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                      {
                        PAYMENT_METHODS.find(
                          (m) => m.value === transaction.payment_method
                        )?.label
                      }
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm">
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Dialog */}
      <AddTransactionDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={loadTransactions}
        selectedDate={selectedDate}
      />
    </div>
  )
}





