'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, FileText, KeyRound, Cpu, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useState, useEffect } from 'react'

interface BotData {
  id: string
  name: string
  instructions: string | null
  openRouterKey: string | null
}

interface BotAIConfigProps {
  botId: string
}

export function BotAIConfig({ botId }: BotAIConfigProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const { data: bot, isLoading } = useQuery<BotData>({
    queryKey: ['bot', botId],
    queryFn: async () => {
      const res = await fetch(`/api/bots/${botId}`)
      if (!res.ok) throw new Error('Failed to fetch bot')
      return res.json()
    },
  })

  const [instructions, setInstructions] = useState('')
  const [openRouterKey, setOpenRouterKey] = useState('')

  useEffect(() => {
    if (bot) {
      setInstructions(bot.instructions || '')
      setOpenRouterKey(bot.openRouterKey || '')
    }
  }, [bot])

  const hasChanges = bot && (
    instructions !== (bot.instructions || '') ||
    openRouterKey !== (bot.openRouterKey || '')
  )

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/bots/${botId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update AI config')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot', botId] })
      toast({ title: '✅ Configuración Guardada', description: 'Los ajustes de IA han sido actualizados.' })
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-64 w-full shimmer rounded-xl" />
      </div>
    )
  }

  if (!bot) return null

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-teal-400" />
          <h3 className="text-lg font-bold text-zinc-100">Configuración de Inteligencia Artificial</h3>
        </div>
        <Button
          onClick={() => saveMutation.mutate({ instructions, openRouterKey })}
          disabled={!hasChanges || saveMutation.isPending}
          className="bg-teal-600 hover:bg-teal-500 text-white gap-2 rounded-xl px-6"
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar Cambios
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Side: Instructions */}
        <Card className="glass border-teal-500/10 md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-zinc-300">
              <FileText className="w-4 h-4 text-teal-500" />
              Instrucciones del Sistema (Prompt)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ej: Eres un asistente experto en cocina española..."
              className="min-h-[250px] glass-card border-teal-500/20 text-zinc-200 text-xs leading-relaxed"
            />
          </CardContent>
        </Card>

        {/* Right Side: OpenRouter */}
        <div className="space-y-6">
          <Card className="glass border-teal-500/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-zinc-300">
                <KeyRound className="w-4 h-4 text-emerald-500" />
                OpenRouter API Key
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="password"
                value={openRouterKey}
                onChange={(e) => setOpenRouterKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="glass-card border-teal-500/20 text-zinc-200 font-mono text-xs"
              />
              <p className="text-[10px] text-zinc-500 mt-2">
                Usada para conectar el bot con modelos de IA externos. La aplicación utilizará automáticamente los modelos gratuitos disponibles en OpenRouter en bucle hasta que uno responda.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
