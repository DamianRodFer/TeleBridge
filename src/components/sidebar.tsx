'use client'

import { useQuery } from '@tanstack/react-query'
import { Bot, Plus, Search, ChevronLeft, ChevronRight, Zap, MessageSquare } from 'lucide-react'
import { useTeleBridgeStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'


interface BotItem {
  id: string
  name: string
  username: string | null
  status: string
  token: string
  instructions: string | null
  createdAt: string
  updatedAt: string
  _count: { messageLogs: number }
}

interface SidebarProps {
  onAddBot: () => void
}

export function Sidebar({ onAddBot }: SidebarProps) {
  const { selectedBotId, setSelectedBotId, searchQuery, setSearchQuery, sidebarCollapsed, toggleSidebar } = useTeleBridgeStore()

  const { data: bots, isLoading } = useQuery<BotItem[]>({
    queryKey: ['bots'],
    queryFn: async () => {
      const res = await fetch('/api/bots', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch bots')
      const data = await res.json()
      console.log('[Sidebar] Bots fetched:', data.length)
      return data
    },
    staleTime: 5000, // Refrescar cada 5 segundos para asegurar sincronización
  })

  const filteredBots = bots?.filter((bot) =>
    bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (bot.username && bot.username.toLowerCase().includes(searchQuery.toLowerCase()))
  ) ?? []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-emerald-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-zinc-500'
    }
  }

  const getBorderColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'border-l-emerald-500'
      case 'error':
        return 'border-l-red-500'
      default:
        return 'border-l-zinc-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Connected'
      case 'error': return 'Error'
      default: return 'Offline'
    }
  }

  if (sidebarCollapsed) {
    return (
      <div className="w-12 glass border-r border-teal-500/10 flex flex-col items-center py-3 gap-2 shrink-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-zinc-400 hover:text-teal-400 hover:bg-zinc-800 transition-colors duration-150"
          onClick={toggleSidebar}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <div className="w-px h-4 bg-zinc-800" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-teal-400 hover:text-teal-300 hover:bg-zinc-800 transition-colors duration-150"
          onClick={onAddBot}
        >
          <Plus className="w-4 h-4" />
        </Button>
        <div className="flex-1" />
        {bots?.map((bot) => (
          <div
            key={bot.id}
            className={cn(
              'w-2 h-2 rounded-full cursor-pointer transition-all duration-200',
              getStatusColor(bot.status),
              selectedBotId === bot.id && 'ring-2 ring-teal-500/50 ring-offset-1 ring-offset-zinc-900',
              bot.status === 'connected' && 'animate-pulse-dot'
            )}
            onClick={() => setSelectedBotId(bot.id)}
            title={bot.name}
          />
        ))}
        <div className="w-px h-4 bg-zinc-800" />
        <span className="text-[10px] text-zinc-500 font-medium">
          {bots?.length ?? 0}
        </span>
      </div>
    )
  }

  return (
    <div className="w-[280px] glass border-r border-teal-500/10 flex flex-col shrink-0 z-10">
      {/* Search Header */}
      <div className="p-3 border-b border-teal-500/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-teal-500/20 to-emerald-500/10 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <span className="text-sm font-semibold text-zinc-100">Bots</span>
            {bots && (
              <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded-full font-medium">
                {bots.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-teal-400 hover:text-teal-300 hover:bg-zinc-800 transition-colors duration-150"
              onClick={onAddBot}
              title="Add new bot"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors duration-150"
              onClick={toggleSidebar}
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-400" />
          <Input
            placeholder="Search bots..."
            className="pl-8 h-8 text-xs glass-card border-teal-500/20 text-zinc-100 placeholder:text-zinc-400 focus-visible:ring-teal-500/40 glow-teal-focus transition-all duration-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-200 transition-colors"
              onClick={() => setSearchQuery('')}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Bot List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 rounded-lg">
                <Skeleton className="h-4 w-24 bg-zinc-800 mb-2" />
                <Skeleton className="h-3 w-16 bg-zinc-800" />
              </div>
            ))
          ) : filteredBots.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Bot className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-xs text-zinc-400 mb-1">
                {searchQuery ? 'No bots match your search' : 'No bots yet'}
              </p>
              {!searchQuery && (
                <p className="text-[11px] text-zinc-500">
                  Click + to add your first bot
                </p>
              )}
            </div>
          ) : (
            filteredBots.map((bot) => (
              <button
                key={bot.id}
                onClick={() => setSelectedBotId(bot.id)}
                className={cn(
                  'w-full text-left p-3 rounded-xl transition-all duration-300 group',
                  'hover:bg-teal-500/5',
                  selectedBotId === bot.id
                    ? 'glass-teal shadow-lg shadow-teal-500/10'
                    : `bg-transparent border-l-2 ${getBorderColor(bot.status)} hover:border-l-teal-400/50`
                )}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-1 shrink-0">
                    <div className={cn(
                      'w-2 h-2 rounded-full transition-all duration-300',
                      getStatusColor(bot.status),
                      bot.status === 'connected' && 'animate-pulse-dot shadow-sm shadow-emerald-500/50'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-zinc-100 truncate group-hover:text-zinc-100 transition-colors">
                        {bot.name}
                      </span>
                    </div>
                    {bot.username && (
                      <div className="text-xs text-zinc-400 truncate">
                        @{bot.username}
                      </div>
                    )}
                    <div className="flex items-center gap-2.5 mt-1.5">
                      <span className={cn(
                        'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                        bot.status === 'connected' && 'bg-emerald-500/10 text-emerald-400',
                        bot.status === 'error' && 'bg-red-500/10 text-red-400',
                        bot.status === 'disconnected' && 'bg-zinc-500/10 text-zinc-400',
                      )}>
                        {getStatusText(bot.status)}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                        <MessageSquare className="w-2.5 h-2.5" />
                        {bot._count.messageLogs}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-teal-500/10 flex items-center justify-between">
        <span className="text-[11px] text-zinc-400 font-medium">
          {bots?.length ?? 0} bot{(bots?.length ?? 0) !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-1">
          <div className={cn(
            'w-1.5 h-1.5 rounded-full',
            (bots?.some(b => b.status === 'connected') ?? false) ? 'bg-emerald-500' : 'bg-zinc-600'
          )} />
          <span className="text-[11px] text-zinc-500">
            {bots?.filter(b => b.status === 'connected').length ?? 0} active
          </span>
        </div>
      </div>
    </div>
  )
}
