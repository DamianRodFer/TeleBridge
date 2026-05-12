'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Loader2 } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'

interface BotData {
  id: string
  name: string
  instructions: string | null
  openRouterKey: string | null
  model: string | null
}

interface EditBotDialogProps {
  bot: BotData
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditBotDialog({ bot, open, onOpenChange }: EditBotDialogProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [name, setName] = useState(bot.name)
  const [instructions, setInstructions] = useState(bot.instructions || '')
  const [openRouterKey, setOpenRouterKey] = useState(bot.openRouterKey || '')
  const [model, setModel] = useState(bot.model || 'openai/gpt-3.5-turbo')

  const updateMutation = useMutation({
    mutationFn: async (data: { name: string; instructions: string | null; openRouterKey: string | null; model: string | null }) => {
      const res = await fetch(`/api/bots/${bot.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to update bot')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot', bot.id] })
      queryClient.invalidateQueries({ queryKey: ['bots'] })
      toast({ title: 'Bot updated', description: 'Bot details have been saved.' })
      onOpenChange(false)
    },
    onError: (error) => {
      toast({
        title: 'Failed to update bot',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate({
      name,
      instructions: instructions || null,
      openRouterKey: openRouterKey || null,
      model: model || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-heavy border-teal-500/20 text-zinc-100 sm:max-w-md shadow-2xl shadow-teal-500/10 overflow-hidden">
        {/* Decorative background glow inside dialog */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <DialogHeader className="relative z-10">
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <Pencil className="w-5 h-5 text-teal-400" />
            Edit Bot
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Update bot name, instructions, and AI model settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-zinc-200 text-xs">Bot Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-card border-teal-500/20 text-zinc-100 focus-visible:ring-teal-500/40 glow-teal-focus transition-all duration-300"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-instructions" className="text-zinc-200 text-xs">
                Instructions
              </Label>
              <Textarea
                id="edit-instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Enter bot instructions..."
                className="glass-card border-teal-500/20 text-zinc-100 focus-visible:ring-teal-500/40 glow-teal-focus transition-all duration-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-openrouter-key" className="text-zinc-200 text-xs">OpenRouter API Key</Label>
              <Input
                id="edit-openrouter-key"
                type="password"
                value={openRouterKey}
                onChange={(e) => setOpenRouterKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="glass-card border-teal-500/20 text-zinc-100 focus-visible:ring-teal-500/40 glow-teal-focus transition-all duration-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-model" className="text-zinc-200 text-xs">AI Model</Label>
              <Input
                id="edit-model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="openai/gpt-3.5-turbo"
                className="glass-card border-teal-500/20 text-zinc-100 focus-visible:ring-teal-500/40 glow-teal-focus transition-all duration-300"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              className="text-zinc-400 hover:text-zinc-100"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white gap-1.5 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 transition-all duration-300 border-0 glow-teal-strong rounded-xl relative z-10"
              disabled={!name || updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Pencil className="w-4 h-4" />
              )}
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
