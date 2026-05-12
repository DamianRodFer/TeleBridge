'use client'

import { Bot, MessageSquare, Zap, ArrowRight, Plus, Shield, Code, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  onAddBot: () => void
}

const steps = [
  {
    icon: Bot,
    title: '1. Crea tu Bot en Telegram',
    description: 'Habla con BotFather en Telegram, crea tu bot y copia el Token HTTP de acceso.',
  },
  {
    icon: Plus,
    title: '2. Añádelo a la Aplicación',
    description: 'Haz clic en el botón inferior para registrar el Token de tu bot en TeleBridge.',
  },
  {
    icon: Zap,
    title: '3. Configura tus APIs',
    description: 'Añade Endpoints de Inteligencia Artificial que se encargarán de procesar y responder.',
  },
  {
    icon: Shield,
    title: '4. Define las Instrucciones',
    description: 'Dile a tu bot cómo debe comportarse estableciendo prompts del sistema.',
  },
  {
    icon: MessageSquare,
    title: '5. ¡Empieza a chatear!',
    description: 'Abre Telegram, escribe a tu bot y recibe respuestas generadas por tu IA.',
  },
]

export function EmptyState({ onAddBot }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center bg-transparent relative overflow-y-auto overflow-x-hidden py-12 min-h-full">
      {/* Decorative background orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/[0.04] rounded-full blur-3xl pointer-events-none" />

      <div className="text-center max-w-2xl mx-auto px-6 relative z-10">
        {/* ── Animated Bot Illustration ── */}
        <div className="relative mb-10 inline-block animate-scale-in-bounce">
          {/* Outer decorative rings */}
          <div className="absolute inset-0 -m-4 rounded-3xl border border-teal-500/10 animate-[spin_20s_linear_infinite]" />
          <div className="absolute inset-0 -m-8 rounded-3xl border border-teal-500/5 border-dashed animate-[spin_30s_linear_infinite_reverse]" />

          {/* Main bot container with floating animation */}
          <div className="empty-state-bot-float w-32 h-32 rounded-2xl bg-gradient-to-br from-teal-500/15 to-emerald-500/10 border border-teal-500/20 flex items-center justify-center mx-auto shadow-xl shadow-teal-500/10 relative">
            {/* Inner glow ring */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-400/10 to-transparent" />
            <Bot className="w-16 h-16 text-teal-400/80 relative z-10" />

            {/* Subtle scan-line effect */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
              <div className="empty-state-scanline absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-400/30 to-transparent" />
            </div>
          </div>

          {/* Zap badge - top right */}
          <div className="empty-state-pulse-icon absolute -top-3 -right-3 w-10 h-10 rounded-xl glass-teal flex items-center justify-center shadow-lg">
            <Zap className="w-4 h-4 text-teal-300" />
          </div>

          {/* MessageSquare badge - bottom left */}
          <div className="empty-state-pulse-icon-delayed absolute -bottom-3 -left-3 w-10 h-10 rounded-xl glass-teal flex items-center justify-center shadow-lg">
            <MessageSquare className="w-4 h-4 text-emerald-300" />
          </div>

          {/* Code badge - top left (extra flair) */}
          <div className="empty-state-pulse-icon-slow absolute -top-1 -left-5 w-8 h-8 rounded-lg glass flex items-center justify-center shadow-md">
            <Code className="w-3.5 h-3.5 text-zinc-400" />
          </div>
        </div>

        {/* ── Gradient Heading ── */}
        <h2 className="text-3xl sm:text-4xl font-bold mb-3 animate-fade-in-up">
          <span className="bg-gradient-to-r from-teal-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
            ¡Hola, qué tal! Bienvenido
          </span>
        </h2>

        <p
          className="text-sm sm:text-base text-zinc-400 mb-10 leading-relaxed max-w-lg mx-auto animate-fade-in-up"
          style={{ animationDelay: '100ms' }}
        >
          Sigue estos 5 sencillos pasos para crear, configurar y poner en marcha tus propios bots de Telegram conectados a Inteligencia Artificial.
        </p>

        {/* ── Enhanced CTA Button ── */}
        <div
          className="mb-14 animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        >
          <div className="gradient-border-animated rounded-xl inline-block">
            <Button
              onClick={onAddBot}
              size="lg"
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white gap-2 transition-all duration-300 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 glow-teal-pulse rounded-xl px-8 h-12 text-base font-semibold relative z-10 border-0"
            >
              <Plus className="w-4.5 h-4.5" />
              Add Your First Bot
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* ── Feature Cards with Glassmorphism ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div
                key={step.title}
                className={`glass-card rounded-xl p-5 glow-teal-hover transition-all duration-300 cursor-default group animate-fade-in-up ${index === 4 ? 'sm:col-span-2 lg:col-span-1' : ''}`}
                style={{ animationDelay: `${(index + 3) * 100}ms` }}
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500/15 to-emerald-500/10 border border-teal-500/20 flex items-center justify-center shrink-0 group-hover:border-teal-400/40 group-hover:from-teal-500/25 group-hover:to-emerald-500/15 transition-all duration-300">
                    <Icon className="w-4 h-4 text-teal-400/70 group-hover:text-teal-300 transition-colors duration-300" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-zinc-100 transition-colors duration-300 mb-1">
                      {step.title}
                    </h3>
                    <p className="text-xs text-zinc-400 group-hover:text-zinc-400 transition-colors duration-300 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Custom keyframes for component-local animations ── */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes pulse-icon {
          0%, 100% {
            transform: scale(1);
            opacity: 0.9;
          }
          50% {
            transform: scale(1.12);
            opacity: 1;
          }
        }

        @keyframes scanline {
          0% {
            top: -10%;
          }
          100% {
            top: 110%;
          }
        }

        .empty-state-bot-float {
          animation: float 4s ease-in-out infinite;
        }

        .empty-state-pulse-icon {
          animation: pulse-icon 2s ease-in-out infinite;
        }

        .empty-state-pulse-icon-delayed {
          animation: pulse-icon 2s ease-in-out infinite 0.5s;
        }

        .empty-state-pulse-icon-slow {
          animation: pulse-icon 2.5s ease-in-out infinite 1s;
        }

        .empty-state-scanline {
          animation: scanline 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
