'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Bot, KeyRound, Loader2, Zap } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'
import { useTeleBridgeStore } from '@/lib/store'

interface AddBotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddBotDialog({ open, onOpenChange }: AddBotDialogProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [skipVerification, setSkipVerification] = useState(false)

  const { setSelectedBotId } = useTeleBridgeStore()

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Error al conectar')
      return result
    },
    onSuccess: (data) => {
      // Forzar actualización inmediata de la barra lateral
      queryClient.setQueryData(['bots'], (old: any) => {
        const existing = (old || []).find((b: any) => b.id === data.id)
        if (existing) return old
        return [data, ...(old || [])]
      })
      queryClient.invalidateQueries({ queryKey: ['bots'] })
      
      if (data.id) setSelectedBotId(data.id)
      
      if (data.warning) {
        // Si el bot ya existía, lo decimos de forma amigable
        if (data.warning.includes('ya estaba registrado')) {
          toast({ title: 'ℹ️ Bot seleccionado', description: 'Este bot ya estaba registrado y ha sido seleccionado.' })
        } else {
          toast({ 
            title: '⚠️ Bot guardado con aviso', 
            description: data.warning,
            variant: 'default'
          })
        }
      } else if (data.warning === undefined && data.status === 'connected') {
        toast({ title: '✅ ¡Bot Conectado!', description: `@${data.username || data.name} ya está en la barra lateral.` })
      } else {
        toast({ title: '✅ Bot Añadido', description: `${data.name} aparece ahora en la barra lateral.` })
      }
      handleClose()
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const handleClose = () => {
    setName('')
    setToken('')
    onOpenChange(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      name,
      token: token.trim(),
      skipVerification,
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass-heavy border-teal-500/20 text-zinc-100 sm:max-w-md shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-teal-400" />
            Conectar Nuevo Bot
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs">
            Introduce el nombre y el token. Podrás configurar la IA después desde el panel del bot.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-zinc-300 text-xs">Nombre del Bot</Label>
            <Input
              placeholder="Ej: Mi Bot Asistente"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-card border-teal-500/20 text-zinc-100"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300 text-xs">Token de Telegram</Label>
            <div className="relative">
              <Input
                type={showToken ? 'text' : 'password'}
                placeholder="12345:ABC..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="glass-card border-teal-500/20 text-zinc-100 font-mono text-xs pr-16"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-2.5 text-[10px] text-zinc-500"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? 'OCULTAR' : 'VER'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl glass-card border-teal-500/10">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <Label className="text-zinc-200 text-xs">Auto-Verificar</Label>
            </div>
            <Switch
              checked={!skipVerification}
              onCheckedChange={(checked) => setSkipVerification(!checked)}
              className="data-[state=checked]:bg-teal-600"
            />
          </div>

          <DialogFooter>
            <Button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Añadir a TeleBridge'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
