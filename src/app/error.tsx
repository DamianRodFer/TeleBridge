'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('TeleBridge Runtime Error:', error)
  }, [error])

  return (
    <div className="h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-zinc-100 mb-2">Algo ha salido mal</h2>
      <p className="text-zinc-500 text-sm max-w-md mb-8">
        La aplicación ha encontrado un error inesperado en el cliente.
        <br />
        <span className="text-[10px] opacity-50 mt-2 block font-mono">
          Error: {error.message || 'Excepción de cliente'}
        </span>
      </p>
      <div className="flex gap-4">
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          className="border-zinc-800 hover:bg-zinc-800"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Recargar Página
        </Button>
        <Button 
          onClick={() => reset()}
          className="bg-teal-600 hover:bg-teal-500 text-white"
        >
          Reintentar Renderizado
        </Button>
      </div>
    </div>
  )
}
