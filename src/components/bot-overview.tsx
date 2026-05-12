'use client'

import { useQuery } from '@tanstack/react-query'
import { Zap, MessageSquare, Link, Clock, Activity, Bot as BotIcon, TrendingUp, CheckCircle2, XCircle, AlertCircle, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'


interface BotStats {
  totalMessages: number
  incomingMessages: number
  outgoingMessages: number
  successMessages: number
  errorMessages: number
  successRate: number
  endpointsCount: number
  activeEndpointsCount: number
  hasInstructions: boolean
}

interface BotData {
  id: string
  name: string
  username: string | null
  status: string
  token: string
  instructions: string | null
  createdAt: string
  updatedAt: string
}

interface BotOverviewProps {
  botId: string
}

export function BotOverview({ botId }: BotOverviewProps) {
  const { data: bot, isLoading } = useQuery<BotData>({
    queryKey: ['bot', botId],
    queryFn: async () => {
      const res = await fetch(`/api/bots/${botId}`)
      if (!res.ok) throw new Error('Failed to fetch bot')
      return res.json()
    },
  })

  const { data: stats } = useQuery<BotStats>({
    queryKey: ['stats', botId],
    queryFn: async () => {
      const res = await fetch(`/api/bots/${botId}/stats`)
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json()
    },
    enabled: !!bot,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="glass border-teal-500/10">
            <CardContent className="p-4">
              <Skeleton className="h-16 w-full shimmer" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!bot) return null

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25">Connected</Badge>
      case 'error':
        return <Badge className="bg-red-500/15 text-red-400 border-red-500/25">Error</Badge>
      default:
        return <Badge className="bg-zinc-500/15 text-zinc-400 border-zinc-500/25">Disconnected</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        <Card className="glass-card border-teal-500/10 hover:border-teal-500/30 transition-all duration-300 group hover:-translate-y-0.5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                <MessageSquare className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-100">{stats?.totalMessages ?? 0}</p>
                <p className="text-[11px] text-zinc-400">API Calls</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-teal-500/10 hover:border-teal-500/30 transition-all duration-300 group hover:-translate-y-0.5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <TrendingUp className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-100">{stats?.successRate ?? 0}%</p>
                <p className="text-[11px] text-zinc-400">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bot Info Card */}
        <Card className="glass border-teal-500/10">
          <CardHeader className="pb-3 border-b border-teal-500/10 mb-3">
            <CardTitle className="text-sm font-medium text-teal-400 flex items-center gap-2">
              <BotIcon className="w-4 h-4" />
              Bot Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-xl glass-card border-teal-500/5 hover:border-teal-500/20 transition-colors">
                <p className="text-[10px] text-zinc-400 mb-0.5">Name</p>
                <p className="text-sm text-zinc-200 flex items-center gap-1.5">
                  <BotIcon className="w-3 h-3 text-teal-400" />
                  {bot.name}
                </p>
              </div>
              <div className="p-2.5 rounded-xl glass-card border-teal-500/5 hover:border-teal-500/20 transition-colors">
                <p className="text-[10px] text-zinc-400 mb-0.5">Username</p>
                <p className="text-sm text-zinc-200">
                  {bot.username ? `@${bot.username}` : 'Not set'}
                </p>
              </div>
              <div className="p-2.5 rounded-xl glass-card border-teal-500/5 hover:border-teal-500/20 transition-colors">
                <p className="text-[10px] text-zinc-400 mb-0.5">Status</p>
                {getStatusBadge(bot.status)}
              </div>
              <div className="p-2.5 rounded-xl glass-card border-teal-500/5 hover:border-teal-500/20 transition-colors">
                <p className="text-[10px] text-zinc-400 mb-0.5">Token</p>
                <p className="text-sm text-zinc-200 font-mono">
                  {bot.token.substring(0, 10)}•••••••
                </p>
              </div>
              <div className="p-2.5 rounded-xl glass-card border-teal-500/5 hover:border-teal-500/20 transition-colors">
                <p className="text-[10px] text-zinc-400 mb-0.5">Created</p>
                <p className="text-sm text-zinc-200">
                  {new Date(bot.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="p-2.5 rounded-xl glass-card border-teal-500/5 hover:border-teal-500/20 transition-colors">
                <p className="text-[10px] text-zinc-400 mb-0.5">Instructions</p>
                <p className="text-sm text-zinc-200 flex items-center gap-1">
                  {bot.instructions ? (
                    <>
                      <FileText className="w-3 h-3 text-teal-400" />
                      Configured
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 text-zinc-500" />
                      None
                    </>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Message Stats Card */}
        <Card className="glass border-teal-500/10">
          <CardHeader className="pb-3 border-b border-teal-500/10 mb-3">
            <CardTitle className="text-sm font-medium text-teal-400 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Message Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center glass-card hover:border-cyan-500/40 transition-colors duration-300">
                <p className="text-lg font-bold text-cyan-400">{stats?.incomingMessages ?? 0}</p>
                <p className="text-[10px] text-zinc-400">Incoming</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center glass-card hover:border-emerald-500/40 transition-colors duration-300">
                <p className="text-lg font-bold text-emerald-400">{stats?.outgoingMessages ?? 0}</p>
                <p className="text-[10px] text-zinc-400">Outgoing</p>
              </div>
              <div className="p-2.5 rounded-xl glass-card border-teal-500/5 hover:border-teal-500/20 text-center transition-colors duration-300">
                <p className="text-lg font-bold text-zinc-200">{stats?.totalMessages ?? 0}</p>
                <p className="text-[10px] text-zinc-400">API Calls</p>
              </div>
            </div>

            {/* Success Rate Bar */}
            {(stats?.totalMessages ?? 0) > 0 && (
              <div className="space-y-2 p-3 rounded-xl glass-card border-teal-500/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300">API Success Rate</span>
                  <span className="text-teal-400 font-medium">{stats?.successRate ?? 0}%</span>
                </div>
                <Progress
                  value={stats?.successRate ?? 0}
                  className="h-2 bg-zinc-900/50"
                />
                <div className="flex items-center gap-4 text-[10px]">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    {stats?.successMessages ?? 0} success
                  </span>
                  <span className="flex items-center gap-1 text-red-400">
                    <XCircle className="w-2.5 h-2.5" />
                    {stats?.errorMessages ?? 0} errors
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
