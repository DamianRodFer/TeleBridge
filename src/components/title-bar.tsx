'use client'

import { Bot, Minus, Square, X, Settings, Bell } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SettingsDialog } from '@/components/settings-dialog'

export function TitleBar() {
  const [mounted, setMounted] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const safeCall = (fnName: string) => {
    if (typeof window !== 'undefined') {
      const fn = (window as any)[fnName]
      if (typeof fn === 'function') {
        try {
          fn()
        } catch (e) {
          console.error(`Error calling ${fnName}:`, e)
        }
      }
    }
  }

  const handleClose = () => safeCall('___close')
  const handleMinimize = () => safeCall('___minimize')
  const handleMaximize = () => safeCall('___maximize')

  const isElectron = mounted && typeof window !== 'undefined' && !!(window as any).electronAPI

  return (
    <>
      <div className="flex items-center h-11 glass-nav border-teal-500/10 px-4 select-none shrink-0 z-20 relative">
        <div className="flex items-center gap-1.5 mr-4">
          <div
            className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-all duration-150 cursor-pointer flex items-center justify-center group hover:scale-110"
            onClick={handleClose}
          >
            <X className="w-1.5 h-1.5 text-red-900 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div
            className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-all duration-150 cursor-pointer flex items-center justify-center group hover:scale-110"
            onClick={handleMinimize}
          >
            <Minus className="w-1.5 h-1.5 text-yellow-900 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div
            className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-all duration-150 cursor-pointer flex items-center justify-center group hover:scale-110"
            onClick={handleMaximize}
          >
            <Square className="w-1 h-1 text-green-900 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-sm shadow-teal-500/20">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-zinc-100 tracking-wide">TeleBridge</span>
          {isElectron && (
            <span className="text-[9px] text-teal-500/60 bg-teal-500/10 px-1.5 py-0.5 rounded font-medium">DESKTOP</span>
          )}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <button className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all duration-150">
            <Bell className="w-3.5 h-3.5" />
          </button>
          <button
            className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-teal-400 hover:bg-zinc-800 transition-all duration-150"
            onClick={() => setSettingsOpen(true)}
            title="Ajustes"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}
