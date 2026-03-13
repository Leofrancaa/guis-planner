"use client"

import * as React from "react"

export function HydrationGuard({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="min-h-screen bg-background" /> // Placeholder neutro
  }

  return <>{children}</>
}
