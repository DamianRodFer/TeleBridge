'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TestTube, Pencil, Trash2, Bot as BotIcon, RefreshCw, Copy, Globe, MoreHorizontal, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTeleBridgeStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { BotOverview } from '@/components/bot-overview'
import { BotAIConfig } from '@/components/bot-ai-config'
import { BotMessages } from '@/components/bot-messages'
import { EditBotDialog } from '@/components/edit-bot-dialog'
import { WebhookDialog } from '@/components/webhook-dialog'
import { cn } from '@/lib/utils'
import { useState } from 'react'


interface BotData {
  id: string
  name: string
  username: string | null
  status: string
  token: string
  instructions: string | null
  openRouterKey: string | null
  model: string | null
  createdAt: string
  updatedAt: string
}

interface BotDetailProps {
  botId: string
  onDelete: () => void
}

export function BotDetail({ botId, onDelete }: BotDetailProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { activeTab, setActiveTab } = useTeleBridgeStore()
  const [editBotOpen, setEditBotOpen] = useState(false)
  const [webhookOpen, setWebhookOpen] = useState(false)

  const { data: bot, isLoading } = useQuery<BotData>({
    queryKey: ['bot', botId],
    queryFn: async () => {
      const res = await fetch(`/api/bots/${botId}`)
      if (!res.ok) throw new Error('Failed to fetch bot')
      return res.json()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/bots/${botId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete bot')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] })
      toast({ title: 'Bot deleted', description: 'The bot has been removed.' })
      onDelete()
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete bot.', variant: 'destructive' })
    },
  })

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/bots/${botId}/test`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.details || 'Test failed')
      if (!data.success) throw new Error(data.message || data.details || 'Test failed')
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bot', botId] })
      queryClient.invalidateQueries({ queryKey: ['bots'] })
      toast({
        title: 'Connection test completed',
        description: data.message || 'Bot is reachable and fully connected',
        variant: 'default',
      })
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to test bot connection.', variant: 'destructive' })
    },
  })

  const duplicateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/bots/${botId}/duplicate`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to duplicate bot')
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bots'] })
      toast({ title: 'Bot duplicated', description: `${data.name} has been created as a copy.` })
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to duplicate bot.', variant: 'destructive' })
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: async () => {
      const newStatus = bot?.status === 'connected' ? 'disconnected' : 'connected'
      const res = await fetch(`/api/bots/${botId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to toggle status')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot', botId] })
      queryClient.invalidateQueries({ queryKey: ['bots'] })
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo cambiar el estado.', variant: 'destructive' })
    },
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/25 gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" /> Connected
        </Badge>
      case 'error':
        return <Badge className="bg-red-500/15 text-red-400 border-red-500/25 hover:bg-red-500/25 gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400" /> Error
        </Badge>
      default:
        return <Badge className="bg-zinc-500/15 text-zinc-400 border-zinc-500/25 hover:bg-zinc-500/25 gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" /> Disconnected
        </Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-transparent">
        <div className="p-6 border-b border-teal-500/10">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-48 shimmer" />
            <Skeleton className="h-6 w-20 shimmer" />
          </div>
        </div>
        <div className="p-6 space-y-6 max-w-4xl">
          <Skeleton className="h-8 w-96 shimmer" />
          <Skeleton className="h-48 w-full shimmer rounded-lg" />
        </div>
      </div>
    )
  }

  if (!bot) return null

  return (
    <div className="flex-1 flex flex-col bg-transparent min-w-0 min-h-0">
      {/* Header */}
      <div className="px-6 py-4 border-b border-teal-500/10 shrink-0 bg-zinc-950/20 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500/15 to-emerald-500/10 border border-teal-500/20 flex items-center justify-center">
              <BotIcon className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-zinc-100">{bot.name}</h2>
                {getStatusBadge(bot.status)}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                {bot.username && (
                  <span className="text-xs text-zinc-400">@{bot.username}</span>
                )}
                <span className="text-[10px] text-zinc-500 font-mono">
                  {bot.token.substring(0, 8)}••••
                </span>
                {bot.instructions && (
                  <span className="text-[10px] text-teal-500/70">✦ Has instructions</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className={bot.status === 'connected'
                ? 'glass-card border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 gap-1.5 h-8 transition-all duration-300'
                : 'glass-card border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 gap-1.5 h-8 transition-all duration-300'
              }
              onClick={() => toggleStatusMutation.mutate()}
              disabled={toggleStatusMutation.isPending}
              title={bot.status === 'connected' ? 'Apagar bot' : 'Encender bot'}
            >
              <Power className="w-3.5 h-3.5" />
              {bot.status === 'connected' ? 'Apagar' : 'Encender'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="glass-card border-teal-500/20 text-zinc-200 hover:text-teal-400 hover:bg-teal-500/10 hover:border-teal-500/40 gap-1.5 h-8 transition-all duration-300 glow-teal-hover"
              onClick={() => testConnectionMutation.mutate()}
              disabled={testConnectionMutation.isPending}
            >
              {testConnectionMutation.isPending ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <TestTube className="w-3.5 h-3.5" />
              )}
              Test
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="glass-card border-teal-500/20 text-zinc-200 hover:text-zinc-100 hover:bg-zinc-800/50 hover:border-teal-500/30 gap-1.5 h-8 transition-all duration-300 glow-teal-hover"
              onClick={() => setEditBotOpen(true)}
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="glass-card border-teal-500/20 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 h-8 w-8 transition-all duration-300 glow-teal-hover"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-zinc-900 border-zinc-800" align="end">
                <DropdownMenuItem
                  className="text-zinc-200 focus:text-zinc-100 focus:bg-zinc-800 gap-2 cursor-pointer"
                  onClick={() => setWebhookOpen(true)}
                >
                  <Globe className="w-3.5 h-3.5" />
                  Webhook Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-zinc-200 focus:text-zinc-100 focus:bg-zinc-800 gap-2 cursor-pointer"
                  onClick={() => duplicateMutation.mutate()}
                  disabled={duplicateMutation.isPending}
                >
                  <Copy className="w-3.5 h-3.5" />
                  Duplicate Bot
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem
                  className="text-red-400 focus:text-red-300 focus:bg-red-500/10 gap-2 cursor-pointer"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Bot
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="px-6 pt-3 shrink-0">
          <TabsList className="glass-nav h-9 p-0.5 border-teal-500/10">
            <TabsTrigger
              value="overview"
              className="text-xs px-3 rounded-md data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-400 data-[state=active]:shadow-sm transition-all duration-300"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="ai-config"
              className="text-xs px-3 rounded-md data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-400 data-[state=active]:shadow-sm transition-all duration-300"
            >
              Configuración IA
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              className="text-xs px-3 rounded-md data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-400 data-[state=active]:shadow-sm transition-all duration-300"
            >
              Messages
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="flex-1 overflow-y-auto mt-0">
          <BotOverview botId={botId} />
        </TabsContent>
        <TabsContent value="ai-config" className="flex-1 overflow-y-auto mt-0">
          <BotAIConfig botId={botId} />
        </TabsContent>
        <TabsContent value="messages" className="flex-1 overflow-y-auto mt-0">
          <BotMessages botId={botId} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <EditBotDialog
        key={`edit-bot-${bot.id}`}
        bot={bot}
        open={editBotOpen}
        onOpenChange={setEditBotOpen}
      />
      <WebhookDialog
        botId={botId}
        botToken={bot.token}
        open={webhookOpen}
        onOpenChange={setWebhookOpen}
      />
    </div>
  )
}
