'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { DollarSign, TrendingUp, TrendingDown, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react'
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
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, parseISO, getDate, getMonth } from 'date-fns'
import { tr } from 'date-fns/locale'
import AddTransactionDialog from './AddTransactionDialog'
import { Transaction } from '@/lib/types'
import { paymentMethodMap, transactionTypeMap, formatCategoryName } from '@/lib/constants'

export default function FinancePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [chartView, setChartView] = useState<'monthly' | 'yearly'>('monthly')

  useEffect(() => {
    loadTransactions()
  }, [chartView])

  const loadTransactions = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Load transactions based on chart view
    let dateStart: Date
    let dateEnd: Date

    if (chartView === 'monthly') {
      // Current month
      dateStart = startOfMonth(new Date())
      dateEnd = endOfMonth(new Date())
    } else {
      // Current year
      dateStart = startOfYear(new Date())
      dateEnd = endOfYear(new Date())
    }

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
      .gte('transaction_date', format(dateStart, 'yyyy-MM-dd'))
      .lte('transaction_date', format(dateEnd, 'yyyy-MM-dd'))
      .order('transaction_date', { ascending: false })

    if (error) {
      console.error('Error loading transactions:', error)
      alert('İşlemler yüklenirken hata: ' + error.message)
      setTransactions([])
    } else if (data) {
      // Cast to Transaction[] - type is properly defined in lib/types.ts
      setTransactions(data as Transaction[])
    } else {
      setTransactions([])
    }

    setLoading(false)
  }

  // Calculate stats based on current view
  const stats = useMemo(() => {
    const income = transactions
      .filter((t) => (t.type as string) === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const expense = transactions
      .filter((t) => (t.type as string) === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const net = income - expense

    return {
      income,
      expense,
      net,
    }
  }, [transactions])

  // Prepare chart data based on view (monthly: daily, yearly: monthly)
  const chartData = useMemo(() => {
    if (chartView === 'monthly') {
      // Monthly view: Daily breakdown for current month
      const currentMonthStart = startOfMonth(new Date())
      const currentMonthEnd = endOfMonth(new Date())
      const days = eachDayOfInterval({
        start: currentMonthStart,
        end: currentMonthEnd,
      })

      return days.map((day) => {
        const dayStr = format(day, 'yyyy-MM-dd')
        const dayTransactions = transactions.filter(
          (t) => t.transaction_date === dayStr
        )

        const dayIncome = dayTransactions
          .filter((t) => (t.type as string) === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0)

        const dayExpense = dayTransactions
          .filter((t) => (t.type as string) === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0)

        return {
          name: getDate(day).toString(), // Day number (1, 2, 3...)
          income: dayIncome,
          expense: dayExpense,
        }
      })
    } else {
      // Yearly view: Monthly breakdown for current year
      const currentYear = new Date().getFullYear()
      const months = Array.from({ length: 12 }, (_, i) => i) // 0-11

      return months.map((monthIndex) => {
        // Filter transactions for this month
        const monthTransactions = transactions.filter((t) => {
          const transactionDate = parseISO(t.transaction_date)
          return (
            transactionDate.getFullYear() === currentYear &&
            transactionDate.getMonth() === monthIndex
          )
        })

        const monthIncome = monthTransactions
          .filter((t) => (t.type as string) === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0)

        const monthExpense = monthTransactions
          .filter((t) => (t.type as string) === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0)

        // Turkish month names
        const monthNames = [
          'Oca',
          'Şub',
          'Mar',
          'Nis',
          'May',
          'Haz',
          'Tem',
          'Ağu',
          'Eyl',
          'Eki',
          'Kas',
          'Ara',
        ]

        return {
          name: monthNames[monthIndex],
          income: monthIncome,
          expense: monthExpense,
        }
      })
    }
  }, [transactions, chartView])

  const handleSuccess = () => {
    loadTransactions()
    setIsDialogOpen(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu işlemi silmek istediğinize emin misiniz?')) {
      return
    }

    const { error } = await supabase.from('transactions').delete().eq('id', id)

    if (error) {
      alert('Silinirken hata: ' + error.message)
    } else {
      loadTransactions()
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    return paymentMethodMap[method] || method
  }

  const getTransactionTypeLabel = (type: string) => {
    return transactionTypeMap[type] || type
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
          <h1 className="text-3xl font-bold text-gray-900">Finans</h1>
          <p className="text-gray-600 mt-1">
            {chartView === 'monthly'
              ? `${format(new Date(), 'MMMM yyyy', { locale: tr })} Finansal Özeti`
              : `${format(new Date(), 'yyyy', { locale: tr })} Yıllık Finansal Özeti`}
          </p>
        </div>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="hidden md:inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>İşlem Ekle</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Income Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Toplam Gelir</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ₺{stats.income.toLocaleString('tr-TR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Expense Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Toplam Gider</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ₺{stats.expense.toLocaleString('tr-TR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        {/* Net Profit Card */}
        <div
          className={`bg-white rounded-xl shadow-sm p-6 border ${
            stats.net >= 0 ? 'border-green-200' : 'border-red-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Kar/Zarar</p>
              <p
                className={`text-3xl font-bold mt-2 ${
                  stats.net >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                ₺{stats.net.toLocaleString('tr-TR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                stats.net >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              <DollarSign
                className={`w-6 h-6 ${
                  stats.net >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {chartView === 'monthly' ? 'Günlük Gelir/Gider Grafiği' : 'Aylık Gelir/Gider Grafiği'}
          </h2>
          
          {/* View Toggle Buttons */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1 w-fit">
            <button
              onClick={() => setChartView('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                chartView === 'monthly'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bu Ay
            </button>
            <button
              onClick={() => setChartView('yearly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                chartView === 'yearly'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bu Yıl
            </button>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              formatter={(value: number) =>
                `₺${value.toLocaleString('tr-TR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              }
            />
            <Legend />
            <Bar dataKey="income" fill="#16a34a" name="Gelir" />
            <Bar dataKey="expense" fill="#dc2626" name="Gider" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">İşlem Listesi</h2>
        </div>
        <div className="p-6">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium mb-2">
                Henüz işlem eklenmemiş
              </p>
              <p className="text-gray-500 text-sm mb-6">
                İlk işleminizi ekleyerek başlayın.
              </p>
              <button
                onClick={() => setIsDialogOpen(true)}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                <span>İşlem Ekle</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        (transaction.type as string) === 'income'
                          ? 'bg-green-100'
                          : 'bg-red-100'
                      }`}
                    >
                      {(transaction.type as string) === 'income' ? (
                        <ArrowUpRight
                          className={`w-5 h-5 ${
                            (transaction.type as string) === 'income'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        />
                      ) : (
                        <ArrowDownRight
                          className={`w-5 h-5 ${
                            (transaction.type as string) === 'income'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold text-gray-900">
                          {formatCategoryName(transaction.category)}
                        </p>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            (transaction.type as string) === 'income'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {getTransactionTypeLabel(transaction.type as string)}
                        </span>
                      </div>
                      {transaction.description && (
                        <p className="text-sm text-gray-600 mt-1 truncate">
                          {transaction.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                        <span>
                          {format(parseISO(transaction.transaction_date), 'd MMMM yyyy', {
                            locale: tr,
                          })}
                        </span>
                        <span>•</span>
                        <span>{getPaymentMethodLabel(transaction.payment_method || 'other')}</span>
                        {transaction.clients?.name && (
                          <>
                            <span>•</span>
                            <span>{transaction.clients.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 ml-4">
                    <p
                      className={`text-lg font-bold ${
                        (transaction.type as string) === 'income'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {(transaction.type as string) === 'income' ? '+' : '-'}₺
                      {Number(transaction.amount).toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      title="Sil"
                    >
                      <span className="text-sm">Sil</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Transaction Dialog */}
      {/* Mobile FAB */}
      <button
        onClick={() => setIsDialogOpen(true)}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-colors flex items-center justify-center z-40 active:scale-95"
        aria-label="İşlem Ekle"
      >
        <Plus className="w-6 h-6" />
      </button>

      {isDialogOpen && (
        <AddTransactionDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
