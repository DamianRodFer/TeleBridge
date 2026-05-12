'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'

interface BotData {
  id: string
  name: string
  instructions: string | null
}

interface BotInstructionsProps {
  botId: string
}

function InstructionsEditor({ botId, initialInstructions }: { botId: string; initialInstructions: string }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [instructions, setInstructions] = useState(initialInstructions)
  const hasChanges = instructions !== initialInstructions

  const saveMutation = useMutation({
    mutationFn: async (newInstructions: string) => {
      const res = await fetch(`/api/bots/${botId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructions: newInstructions || null }),
      })
      if (!res.ok) throw new Error('Failed to update instructions')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot', botId] })
      queryClient.invalidateQueries({ queryKey: ['bots'] })
      toast({ title: 'Instructions saved', description: 'Bot instructions have been updated.' })
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to save instructions.', variant: 'destructive' })
    },
  })

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-teal-400" />
          <h3 className="text-sm font-medium text-zinc-300">Bot Instructions</h3>
        </div>
        <Button
          size="sm"
          className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white gap-1.5 h-8 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 transition-all duration-300 border-0 glow-teal-strong"
          onClick={() => saveMutation.mutate(instructions)}
          disabled={!hasChanges || saveMutation.isPending}
        >
          <Save className="w-3.5 h-3.5" />
          {saveMutation.isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>

      <Card className="glass border-teal-500/10">
        <CardContent className="p-4 space-y-3">
          <p className="text-xs text-zinc-400">
            Define custom instructions for your bot. These instructions will guide how the bot responds
            to messages and interacts with connected APIs. You can use Markdown formatting.
          </p>
          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Enter bot instructions...&#10;&#10;Example:&#10;You are a helpful assistant that answers questions about our products.&#10;When a user asks about pricing, use the pricing API endpoint.&#10;Always be polite and professional."
            className="min-h-64 glass-card border-teal-500/20 text-zinc-200 placeholder:text-zinc-600 font-mono text-sm focus-visible:ring-teal-500/40 glow-teal-focus resize-y transition-all duration-300"
          />
          {hasChanges && (
            <p className="text-xs text-amber-400/80">
              You have unsaved changes
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function BotInstructions({ botId }: BotInstructionsProps) {
  const { data: bot, isLoading } = useQuery<BotData>({
    queryKey: ['bot', botId],
    queryFn: async () => {
      const res = await fetch(`/api/bots/${botId}`)
      if (!res.ok) throw new Error('Failed to fetch bot')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-32 shimmer" />
        <Skeleton className="h-64 w-full shimmer rounded-xl border border-teal-500/10" />
      </div>
    )
  }

  if (!bot) return null

  return (
    <InstructionsEditor
      key={botId}
      botId={botId}
      initialInstructions={bot.instructions || ''}
    />
  )
}
