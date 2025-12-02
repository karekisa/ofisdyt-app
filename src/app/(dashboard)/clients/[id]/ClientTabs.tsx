'use client'

import { useState } from 'react'
import MeasurementsTab from './MeasurementsTab'
import DietListsTab from './DietListsTab'
import ProgressTab from './ProgressTab'
import { Client } from '@/lib/types'

type ClientTabsProps = {
  clientId: string
  client: Client
  profession: 'dietitian' | 'psychologist' | 'pt' | 'consultant' | null
}

export default function ClientTabs({ clientId, client, profession }: ClientTabsProps) {
  const [activeTab, setActiveTab] = useState('overview')

  // Determine which tabs to show based on profession
  const isDietitian = profession === 'dietitian'
  const isPT = profession === 'pt'

  // For dietitians: show all tabs
  // For PT: show Overview and Diet Lists (renamed to Workouts)
  // For others: show only Overview (Info) and Session Notes

  const tabs = [
    { id: 'overview', label: isDietitian ? 'Genel Bakış' : 'Bilgiler' },
    ...(isDietitian
      ? [
          { id: 'measurements', label: 'Ölçümler' },
          { id: 'diet-lists', label: 'Diyet Listeleri' },
          { id: 'progress', label: 'Gelişim' },
        ]
      : isPT
        ? [{ id: 'diet-lists', label: 'Egzersiz Programı' }]
        : []),
    ...(!isDietitian ? [{ id: 'notes', label: 'Seans Notları' }] : []),
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-1 px-4" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Danışan Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Ad</p>
                <p className="text-gray-900 font-medium">{client.name}</p>
              </div>
              {client.phone && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Telefon</p>
                  <p className="text-gray-900 font-medium">{client.phone}</p>
                </div>
              )}
              {client.age && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Yaş</p>
                  <p className="text-gray-900 font-medium">{client.age}</p>
                </div>
              )}
              {client.height && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Boy (cm)</p>
                  <p className="text-gray-900 font-medium">{client.height}</p>
                </div>
              )}
              {client.gender && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Cinsiyet</p>
                  <p className="text-gray-900 font-medium">
                    {client.gender === 'male'
                      ? 'Erkek'
                      : client.gender === 'female'
                        ? 'Kadın'
                        : 'Diğer'}
                  </p>
                </div>
              )}
              {client.created_at && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Kayıt Tarihi</p>
                  <p className="text-gray-900 font-medium">
                    {new Date(client.created_at).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              )}
            </div>
            {client.notes && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Notlar</p>
                <p className="text-gray-900 whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'measurements' && isDietitian && (
          <MeasurementsTab clientId={clientId} />
        )}

        {activeTab === 'diet-lists' && (isDietitian || isPT) && (
          <DietListsTab
            clientId={clientId}
            clientName={client.name}
            clientPhone={client.phone}
            profession={profession}
          />
        )}

        {activeTab === 'progress' && isDietitian && (
          <ProgressTab clientId={clientId} />
        )}

        {activeTab === 'notes' && !isDietitian && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Seans Notları</h3>
            {client.notes ? (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-900 whitespace-pre-wrap">{client.notes}</p>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Henüz seans notu eklenmemiş.</p>
                <p className="text-sm mt-2">
                  Notları eklemek için danışan bilgilerini düzenleyin.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
