'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Cargamos TODO de forma dinámica con SSR desactivado.
// Esto evita que cualquier componente intente acceder a APIs del navegador/Electron en el servidor.
const DynamicDashboard = dynamic(() => import('@/components/dashboard-container').then(mod => mod.DashboardContainer), { 
  ssr: false,
  loading: () => (
    <div className="h-screen bg-[#09090b] flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(20,184,166,0.3)]"></div>
      <span className="text-zinc-500 text-xs font-medium tracking-widest animate-pulse">CARGANDO TELEBRIDGE...</span>
    </div>
  )
})

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-screen bg-[#09090b]" />
  }

  return <DynamicDashboard />
}
