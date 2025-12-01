'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User, Scale, TrendingUp, FileText } from 'lucide-react'
import MeasurementsTab from './MeasurementsTab'
import ProgressTab from './ProgressTab'
import DietListsTab from './DietListsTab'

type Client = {
  id: string
  name: string
  phone: string | null
  age: number | null
  height: number | null
  gender: string | null
  notes: string | null
}

type ClientTabsProps = {
  clientId: string
  activeTab: 'info' | 'measurements' | 'progress' | 'dietlists'
  setActiveTab: (tab: 'info' | 'measurements' | 'progress' | 'dietlists') => void
  client: Client
}

export default function ClientTabs({
  clientId,
  activeTab,
  setActiveTab,
  client,
}: ClientTabsProps) {
  const tabs = [
    { id: 'info' as const, label: 'Bilgiler', icon: User },
    { id: 'measurements' as const, label: 'Ölçümler', icon: Scale },
    { id: 'progress' as const, label: 'Gelişim Grafiği', icon: TrendingUp },
    { id: 'dietlists' as const, label: 'Diyet Listeleri', icon: FileText },
  ]

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 md:flex-none flex items-center justify-center space-x-2 px-6 py-4 font-medium transition-colors border-b-2 ${
                  isActive
                    ? 'border-green-600 text-green-600 bg-green-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Ad</h3>
                <p className="text-lg text-gray-900">{client.name}</p>
              </div>
              {client.phone && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Telefon
                  </h3>
                  <p className="text-lg text-gray-900">{client.phone}</p>
                </div>
              )}
              {client.age && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Yaş</h3>
                  <p className="text-lg text-gray-900">{client.age} yaş</p>
                </div>
              )}
              {client.height && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Boy
                  </h3>
                  <p className="text-lg text-gray-900">{client.height} cm</p>
                </div>
              )}
              {client.gender && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Cinsiyet
                  </h3>
                  <p className="text-lg text-gray-900">
                    {client.gender === 'male' ? 'Erkek' : client.gender === 'female' ? 'Kadın' : client.gender === 'other' ? 'Diğer' : client.gender}
                  </p>
                </div>
              )}
              {client.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Notlar
                  </h3>
                  <p className="text-lg text-gray-900 whitespace-pre-wrap">
                    {client.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'measurements' && (
            <MeasurementsTab clientId={clientId} />
          )}

          {activeTab === 'progress' && <ProgressTab clientId={clientId} />}

          {activeTab === 'dietlists' && (
            <DietListsTab
              clientId={clientId}
              clientName={client.name}
              clientPhone={client.phone}
            />
          )}
        </div>
      </div>
    </div>
  )
}

