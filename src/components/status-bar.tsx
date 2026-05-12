'use client'

import { useQuery } from '@tanstack/react-query'
import { Activity, Wifi, WifiOff, Clock, Cpu, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface BotItem {
  id: string
  name: string
  status: string
  updatedAt: string
}

export function StatusBar() {
  const { data: bots } = useQuery<BotItem[]>({
    queryKey: ['bots'],
    queryFn: async () => {
      const res = await fetch('/api/bots')
      if (!res.ok) throw new Error('Failed to fetch bots')
      return res.json()
    },
    refetchInterval: 30000,
  })

  const totalBots = bots?.length ?? 0
  const activeBots = bots?.filter(b => b.status === 'connected').length ?? 0
  const hasErrors = bots?.some(b => b.status === 'error') ?? false
  const lastUpdated = bots?.reduce((latest, bot) => {
    const d = new Date(bot.updatedAt)
    return d > latest ? d : latest
  }, new Date(0))

  return (
    <div className="h-7 glass-nav border-t border-teal-500/10 flex items-center px-4 gap-5 shrink-0 z-20 relative">
      <div className="flex items-center gap-1.5">
        <Activity className="w-3 h-3 text-zinc-500" />
        <span className="text-[11px] text-zinc-400">
          {totalBots} bot{totalBots !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {activeBots > 0 ? (
          <Wifi className="w-3 h-3 text-emerald-500" />
        ) : (
          <WifiOff className="w-3 h-3 text-zinc-500" />
        )}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-800/50 border border-zinc-700/30">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[10px] text-zinc-400 font-medium tracking-tight">API CONNECTED</span>
        </div>
      </div>

      {hasErrors && (
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse-dot" />
          <span className="text-[11px] text-red-400">Errors detected</span>
        </div>
      )}

      <div className="flex-1" />

      {lastUpdated && lastUpdated.getTime() > 0 && (
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-zinc-500" />
          <span className="text-[11px] text-zinc-500">
            Last activity {formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </span>
        </div>
      )}

      <div className="w-px h-3 bg-zinc-800" />

      <div className="flex items-center gap-1.5">
        <Cpu className="w-3 h-3 text-zinc-500" />
        <span className="text-[11px] text-zinc-700">TeleBridge v1.2</span>
      </div>
    </div>
  )
}
