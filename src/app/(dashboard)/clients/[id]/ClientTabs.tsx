'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="w-full justify-start">
        <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
        <TabsTrigger value="measurements">Ölçümler</TabsTrigger>
        <TabsTrigger value="diet-lists">Diyet Listeleri</TabsTrigger>
        <TabsTrigger value="progress">İlerleme</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Genel Bilgiler</h2>
          <div className="space-y-4">
            {client.notes && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Notlar</p>
                <p className="text-gray-900 whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500 mb-1">Kayıt Tarihi</p>
              <p className="text-gray-900">
                {new Date(client.created_at).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="measurements" className="mt-6">
        <MeasurementsTab clientId={clientId} />
      </TabsContent>

      <TabsContent value="diet-lists" className="mt-6">
        <DietListsTab
          clientId={clientId}
          clientName={client.name}
          clientPhone={client.phone}
        />
      </TabsContent>

      <TabsContent value="progress" className="mt-6">
        <ProgressTab clientId={clientId} client={client} />
      </TabsContent>
    </Tabs>
  )
}
