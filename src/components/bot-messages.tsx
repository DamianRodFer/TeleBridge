'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, MessageSquare, ArrowDownLeft, ArrowUpRight, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

interface MessageLog {
  id: string
  direction: string
  sender: string | null
  content: string
  apiStatus: string | null
  error: string | null
  createdAt: string
}

interface MessagesResponse {
  messages: MessageLog[]
  total: number
  limit: number
  offset: number
}

interface BotMessagesProps {
  botId: string
}

export function BotMessages({ botId }: BotMessagesProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [directionFilter, setDirectionFilter] = useState<string>('')

  const { data, isLoading } = useQuery<MessagesResponse>({
    queryKey: ['messages', botId, directionFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50', offset: '0' })
      if (directionFilter) params.set('direction', directionFilter)
      const res = await fetch(`/api/bots/${botId}/messages?${params}`)
      if (!res.ok) throw new Error('Failed to fetch messages')
      return res.json()
    },
  })

  const clearMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/bots/${botId}/messages`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to clear messages')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', botId] })
      queryClient.invalidateQueries({ queryKey: ['bot', botId] })
      queryClient.invalidateQueries({ queryKey: ['bots'] })
      toast({ title: 'Messages cleared', description: 'All message logs have been removed.' })
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to clear messages.', variant: 'destructive' })
    },
  })

  const messages = data?.messages ?? []

  const getApiStatusBadge = (status: string | null) => {
    if (!status) return null
    switch (status) {
      case 'success':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5">OK</Badge>
      case 'error':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] px-1.5">ERR</Badge>
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-1.5">PEND</Badge>
      default:
        return null
    }
  }

  return (
    <div className="p-6 space-y-4 flex flex-col h-full">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-teal-400" />
          <h3 className="text-sm font-medium text-zinc-300">Message Log</h3>
          {data && (
            <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 text-[10px]">
              {data.total}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 glass-card border-teal-500/10 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-6 px-2 text-[11px] rounded-md transition-all duration-300',
                directionFilter === '' ? 'bg-teal-500/20 text-teal-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              )}
              onClick={() => setDirectionFilter('')}
            >
              All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-6 px-2 text-[11px] rounded-md gap-1 transition-all duration-300',
                directionFilter === 'incoming' ? 'bg-teal-500/20 text-teal-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              )}
              onClick={() => setDirectionFilter('incoming')}
            >
              <ArrowDownLeft className="w-3 h-3" /> In
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-6 px-2 text-[11px] rounded-md gap-1 transition-all duration-300',
                directionFilter === 'outgoing' ? 'bg-teal-500/20 text-teal-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              )}
              onClick={() => setDirectionFilter('outgoing')}
            >
              <ArrowUpRight className="w-3 h-3" /> Out
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="glass-card border-red-500/20 text-red-400/80 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 gap-1.5 h-7 transition-all duration-300"
            onClick={() => clearMutation.mutate()}
            disabled={messages.length === 0 || clearMutation.isPending}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full shimmer rounded-xl border border-teal-500/5" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <Card className="glass border-teal-500/10 border-dashed flex-1">
          <CardContent className="p-8 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
            <div className="w-16 h-16 rounded-full bg-teal-500/5 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-teal-500/40" />
            </div>
            <p className="text-sm text-zinc-300 mb-1">No messages yet</p>
            <p className="text-xs text-zinc-500 max-w-xs text-center">Messages will appear here when your bot receives or sends messages</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="flex-1 max-h-[calc(100vh-320px)]">
          <div className="space-y-1.5">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-xl border transition-all duration-300 hover:scale-[1.01]',
                  message.direction === 'incoming'
                    ? 'glass-card border-cyan-500/10 hover:border-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/5'
                    : 'glass-card border-emerald-500/10 hover:border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/5',
                )}
              >
                <div className="shrink-0 mt-0.5">
                  {message.direction === 'incoming' ? (
                    <ArrowDownLeft className="w-4 h-4 text-teal-400" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-zinc-400">
                      {message.direction === 'incoming' ? 'Incoming' : 'Outgoing'}
                    </span>
                    {message.sender && (
                      <span className="text-xs text-zinc-500">
                        from {message.sender}
                      </span>
                    )}
                    {getApiStatusBadge(message.apiStatus)}
                    <span className="text-[10px] text-zinc-600 ml-auto shrink-0">
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-300 font-mono break-words whitespace-pre-wrap">
                    {message.content}
                  </p>
                  {message.error && (
                    <p className="text-xs text-red-400 mt-1 font-mono">
                      Error: {message.error}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
