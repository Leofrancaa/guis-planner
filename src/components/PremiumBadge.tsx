"use client"

import { useAuthStore } from "@/store/authStore"
import { Crown } from "lucide-react"
import { cn } from "@/lib/utils"

interface PremiumBadgeProps {
  className?: string
}

export function PremiumBadge({ className }: PremiumBadgeProps) {
  const { user, isPremium } = useAuthStore()

  if (!user) return null

  const premium = isPremium()

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
        premium
          ? "bg-amber-400/20 text-amber-500 border border-amber-400/30"
          : "bg-muted text-muted-foreground border border-border/50",
        className
      )}
    >
      {premium && <Crown className="w-2.5 h-2.5" />}
      {premium ? "Premium" : "Free"}
    </span>
  )
}
