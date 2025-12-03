'use client'

import { useState } from 'react'
import MeasurementsTab from './MeasurementsTab'
import DietListsTab from './DietListsTab'
import ProgressTab from './ProgressTab'
import { Client } from '@/lib/types'

type ClientTabsProps = {
  clientId: string
  client: Client
}

export default function ClientTabs({ clientId, client }: ClientTabsProps) {
  const [activeTab, setActiveTab] = useState('overview')

  // Always show all tabs for dietitians
  const tabs = [
    { id: 'overview', label: 'Genel Bakış' },
    { id: 'measurements', label: 'Ölçümler' },
    { id: 'diet-lists', label: 'Diyet Listeleri' },
    { id: 'progress', label: 'Gelişim' },
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

        {activeTab === 'measurements' && (
          <MeasurementsTab clientId={clientId} />
        )}

        {activeTab === 'diet-lists' && (
          <DietListsTab
            clientId={clientId}
            clientName={client.name}
            clientPhone={client.phone}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressTab clientId={clientId} client={client} />
        )}
      </div>
    </div>
  )
}
