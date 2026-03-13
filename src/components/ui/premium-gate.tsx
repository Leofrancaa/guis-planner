"use client"

import { useAuthStore } from "@/store/authStore"
import { Crown } from "lucide-react"

interface PremiumGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PremiumGate({ children, fallback }: PremiumGateProps) {
  const isPremium = useAuthStore(state => state.isPremium)

  if (isPremium()) return <>{children}</>

  if (fallback) return <>{fallback}</>

  return (
    <div className="relative rounded-2xl overflow-hidden">
      <div className="pointer-events-none select-none opacity-30 blur-sm">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-2xl border border-amber-500/30">
        <div className="bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full p-3 shadow-lg mb-3">
          <Crown className="w-6 h-6 text-white" />
        </div>
        <p className="font-bold text-base">Recurso Premium</p>
        <p className="text-sm text-muted-foreground mt-1 text-center px-4 max-w-xs">
          Faça upgrade para o plano Premium para acessar este recurso.
        </p>
      </div>
    </div>
  )
}
