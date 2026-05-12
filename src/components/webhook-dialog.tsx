'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Globe, Loader2, Link2, Unlink, Shield, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface WebhookDialogProps {
  botId: string
  botToken: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface WebhookInfo {
  url: string
  has_custom_certificate: boolean
  pending_update_count: number
  last_error_date: number | null
  last_error_message: string | null
  max_connections: number | null
  allowed_updates: string[] | null
}

export function WebhookDialog({ botId, botToken, open, onOpenChange }: WebhookDialogProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Suggested webhook URL using the new Telegram handler route
  const suggestedWebhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/telegram/${botToken}`
    : `/api/telegram/${botToken}`

  const [webhookUrl, setWebhookUrl] = useState(suggestedWebhookUrl)
  const [secretToken, setSecretToken] = useState('')

  const { data: webhookInfo, isLoading: webhookLoading, refetch } = useQuery<{
    webhookInfo: WebhookInfo
  }>({
    queryKey: ['webhook', botId],
    queryFn: async () => {
      const res = await fetch(`/api/bots/${botId}/webhook`)
      if (!res.ok) throw new Error('Failed to get webhook info')
      return res.json()
    },
    enabled: open,
  })

  const setWebhookMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/bots/${botId}/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl, secretToken: secretToken || undefined }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to set webhook')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot', botId] })
      queryClient.invalidateQueries({ queryKey: ['bots'] })
      refetch()
      toast({ title: 'Webhook set', description: 'The webhook URL has been configured.' })
    },
    onError: (error) => {
      toast({ title: 'Failed to set webhook', description: error.message, variant: 'destructive' })
    },
  })

  const deleteWebhookMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/bots/${botId}/webhook`, { method: 'DELETE' })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to delete webhook')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot', botId] })
      queryClient.invalidateQueries({ queryKey: ['bots'] })
      refetch()
      toast({ title: 'Webhook removed', description: 'The webhook has been deleted.' })
    },
    onError: (error) => {
      toast({ title: 'Failed to remove webhook', description: error.message, variant: 'destructive' })
    },
  })

  const info = webhookInfo?.webhookInfo

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-heavy border-teal-500/20 text-zinc-100 sm:max-w-lg shadow-2xl shadow-teal-500/10 overflow-hidden">
        {/* Decorative background glow inside dialog */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <DialogHeader className="relative z-10">
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <Globe className="w-5 h-5 text-teal-400" />
            Webhook Settings
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Configure the webhook URL for your Telegram bot to receive updates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current Webhook Info */}
          <Card className="glass-card border-teal-500/10">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-teal-400" />
                <span className="text-sm font-medium text-zinc-200">Current Webhook</span>
              </div>
              {webhookLoading ? (
                <Skeleton className="h-12 w-full shimmer rounded" />
              ) : info ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">URL:</span>
                    <span className="text-xs text-zinc-200 font-mono truncate flex-1">
                      {info.url || 'No webhook set'}
                    </span>
                    {info.url ? (
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[10px]">Active</Badge>
                    ) : (
                      <Badge className="bg-zinc-500/15 text-zinc-400 border-zinc-500/25 text-[10px]">None</Badge>
                    )}
                  </div>
                  {info.pending_update_count > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400">Pending:</span>
                      <span className="text-xs text-amber-400">{info.pending_update_count} updates</span>
                    </div>
                  )}
                  {info.last_error_message && (
                    <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded font-mono">
                      {info.last_error_message}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-zinc-400">Could not load webhook info</p>
              )}
            </CardContent>
          </Card>

          {/* Set New Webhook */}
          <div className="space-y-3">
            <Label className="text-zinc-200 text-xs font-medium">Set New Webhook</Label>
            <div className="space-y-2">
              <Label className="text-zinc-400 text-[11px]">Webhook URL</Label>
              <div className="relative">
                <ExternalLink className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
                <Input
                  placeholder="https://your-server.com/api/webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="pl-9 glass-card border-teal-500/20 text-zinc-100 placeholder:text-zinc-500 font-mono text-sm focus-visible:ring-teal-500/40 glow-teal-focus transition-all duration-300"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400 text-[11px]">
                Secret Token <span className="text-zinc-500">(optional)</span>
              </Label>
              <div className="relative">
                <Shield className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
                <Input
                  type="password"
                  placeholder="Secret token for verification"
                  value={secretToken}
                  onChange={(e) => setSecretToken(e.target.value)}
                  className="pl-9 glass-card border-teal-500/20 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-teal-500/40 glow-teal-focus transition-all duration-300"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white gap-1.5 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 transition-all duration-300 border-0 glow-teal-strong rounded-xl relative z-10"
                onClick={() => setWebhookMutation.mutate()}
                disabled={!webhookUrl || setWebhookMutation.isPending}
              >
                {setWebhookMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4" />
                )}
                Set Webhook
              </Button>
              <Button
                variant="outline"
                className="border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/40 gap-1.5 rounded-xl transition-all duration-300 glass-card"
                onClick={() => deleteWebhookMutation.mutate()}
                disabled={deleteWebhookMutation.isPending}
              >
                {deleteWebhookMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Unlink className="w-4 h-4" />
                )}
                Remove
              </Button>
            </div>
          </div>

          {/* Webhook URL Helper */}
          <Card className="glass border-teal-500/20">
            <CardContent className="p-3">
              <p className="text-[11px] text-teal-300/80 leading-relaxed">
                💡 To receive Telegram updates, your webhook URL must be publicly accessible via HTTPS.
                Telegram will send POST requests with updates to this URL.
              </p>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            className="text-zinc-400 hover:text-zinc-100"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
