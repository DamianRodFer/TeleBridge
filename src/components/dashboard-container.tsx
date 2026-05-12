'use client'

import { useState, useEffect } from 'react'
import { TitleBar } from '@/components/title-bar'
import { Sidebar } from '@/components/sidebar'
import { EmptyState } from '@/components/empty-state'
import { BotDetail } from '@/components/bot-detail'
import { AddBotDialog } from '@/components/add-bot-dialog'
import { StatusBar } from '@/components/status-bar'
import { QueryProvider } from '@/components/query-provider'
import { Toaster } from '@/components/ui/toaster'
import { useTeleBridgeStore } from '@/lib/store'

export function DashboardContainer() {
  const [addBotOpen, setAddBotOpen] = useState(false)
  const [ready, setReady] = useState(false)
  
  // Usamos el store renombrado
  const store = useTeleBridgeStore()

  useEffect(() => {
    setReady(true)
  }, [])

  if (!ready) {
    return <div className="h-screen bg-[#09090b] flex items-center justify-center text-zinc-500 text-xs tracking-widest uppercase animate-pulse">Cargando TeleBridge...</div>
  }

  return (
    <QueryProvider>
      <div className="h-screen flex flex-col bg-zinc-950 overflow-hidden relative">
        <TitleBar />
        <div className="flex flex-1 min-h-0">
          <Sidebar onAddBot={() => setAddBotOpen(true)} />
          <main className="flex-1 flex flex-col min-h-0">
            {store.selectedBotId ? (
              <BotDetail
                botId={store.selectedBotId}
                onDelete={() => store.setSelectedBotId(null)}
              />
            ) : (
              <EmptyState onAddBot={() => setAddBotOpen(true)} />
            )}
          </main>
        </div>
        <StatusBar />
        <AddBotDialog open={addBotOpen} onOpenChange={setAddBotOpen} />
        <Toaster />
      </div>
    </QueryProvider>
  )
}
