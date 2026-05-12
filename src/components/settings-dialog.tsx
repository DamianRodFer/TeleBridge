'use client'

import { useEffect, useState } from 'react'
import { Settings, Globe, Key, ExternalLink, RefreshCw, CheckCircle, XCircle, Loader2, Copy } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { toast } = useToast()
  const [ngrokToken, setNgrokToken] = useState('')
  const [ngrokUrl, setNgrokUrl] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)
  const [isElectron, setIsElectron] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.getSettings) {
      setIsElectron(true)
    }
  }, [])

  // Load settings and current ngrok URL when dialog opens
  useEffect(() => {
    if (!open || !isElectron) return
    const api = (window as any).electronAPI
    api.getSettings().then((s: any) => {
      setNgrokToken(s.ngrokAuthtoken || '')
    })
    api.getNgrokUrl().then((url: string | null) => {
      setNgrokUrl(url)
    })
  }, [open, isElectron])

  const handleSave = async () => {
    if (!isElectron) return
    setIsSaving(true)
    try {
      await (window as any).electronAPI.saveSettings({ ngrokAuthtoken: ngrokToken.trim() })
      toast({ title: 'Ajustes guardados', description: 'Reinicia el túnel para aplicar el nuevo token.' })
    } catch (e) {
      toast({ title: 'Error al guardar', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleRestartTunnel = async () => {
    if (!isElectron) return
    setIsRestarting(true)
    setNgrokUrl(null)
    try {
      // Save first
      await (window as any).electronAPI.saveSettings({ ngrokAuthtoken: ngrokToken.trim() })
      const url = await (window as any).electronAPI.restartNgrok()
      setNgrokUrl(url)
      if (url) {
        toast({ title: '✅ Túnel activo', description: `URL pública: ${url}` })
      } else {
        toast({ title: 'Túnel no disponible', description: 'Comprueba que el token de ngrok es correcto.', variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Error al iniciar túnel', description: e.message, variant: 'destructive' })
    } finally {
      setIsRestarting(false)
    }
  }

  const copyUrl = () => {
    if (ngrokUrl) {
      navigator.clipboard.writeText(ngrokUrl)
      toast({ title: 'URL copiada' })
    }
  }

  if (!isElectron) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-heavy border-teal-500/20 text-zinc-100 sm:max-w-md shadow-2xl shadow-teal-500/10 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <DialogHeader className="relative z-10">
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <Settings className="w-5 h-5 text-teal-400" />
            Ajustes de TeleBridge
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Configura el túnel público para que Telegram pueda comunicarse con tu app.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 relative z-10">
          {/* Tunnel status */}
          <Card className="glass-card border-teal-500/10">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-teal-400" />
                <span className="text-sm font-medium text-zinc-200">Estado del túnel ngrok</span>
              </div>
              {ngrokUrl ? (
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs text-emerald-300 font-mono truncate flex-1">{ngrokUrl}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-zinc-400 hover:text-zinc-100" onClick={copyUrl}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <XCircle className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span className="text-xs text-zinc-500">Sin túnel activo</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ngrok token */}
          <div className="space-y-2">
            <Label className="text-zinc-200 text-sm font-medium flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-teal-400" />
              ngrok Authtoken
            </Label>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Obtén tu token gratuito en{' '}
              <a
                href="https://dashboard.ngrok.com/get-started/your-authtoken"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 hover:text-teal-300 underline underline-offset-2 inline-flex items-center gap-0.5"
                onClick={(e) => {
                  e.preventDefault()
                  if (typeof window !== 'undefined' && (window as any).electronAPI) {
                    // Open in system browser via Electron shell
                    fetch('/api/open-url', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({url:'https://dashboard.ngrok.com/get-started/your-authtoken'}) }).catch(() => {})
                  }
                }}
              >
                dashboard.ngrok.com <ExternalLink className="w-2.5 h-2.5" />
              </a>
              {' '}(gratis, solo necesitas una cuenta)
            </p>
            <Input
              type="password"
              placeholder="2abc123def456..."
              value={ngrokToken}
              onChange={(e) => setNgrokToken(e.target.value)}
              className="glass-card border-teal-500/20 text-zinc-100 placeholder:text-zinc-500 font-mono text-sm focus-visible:ring-teal-500/40 glow-teal-focus transition-all duration-300"
            />
          </div>

          {/* How it works */}
          <Card className="glass border-teal-500/15">
            <CardContent className="p-3">
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                💡 <strong className="text-zinc-300">¿Cómo funciona?</strong> Al guardar y activar el túnel, TeleBridge crea automáticamente una URL HTTPS pública y registra el webhook en Telegram para todos tus bots. Sin configuración manual.
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white gap-1.5 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 transition-all duration-300 border-0 rounded-xl"
              onClick={handleRestartTunnel}
              disabled={isRestarting || !ngrokToken.trim()}
            >
              {isRestarting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isRestarting ? 'Activando...' : 'Guardar y Activar Túnel'}
            </Button>
            <Button
              variant="outline"
              className="glass-card border-teal-500/20 text-zinc-300 hover:text-zinc-100 gap-1.5 rounded-xl"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Guardar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
