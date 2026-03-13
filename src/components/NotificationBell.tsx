"use client"

import * as React from "react"
import { Bell, CheckCheck } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useNotificationStore } from "@/store/notificationStore"
import { useAuthStore } from "@/store/authStore"

export function NotificationBell() {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const { notifications, unreadCount, loading, fetchNotifications, fetchUnreadCount, markRead, markAllRead } =
    useNotificationStore()

  // Poll unread count every 60s
  React.useEffect(() => {
    if (!isAuthenticated) return
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 60_000)
    return () => clearInterval(interval)
  }, [isAuthenticated, fetchUnreadCount])

  // Load notifications when opening
  React.useEffect(() => {
    if (open) fetchNotifications()
  }, [open, fetchNotifications])

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  if (!isAuthenticated) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative rounded-full w-10 h-10 flex items-center justify-center hover:bg-muted/50 transition-colors"
        title="Notificações"
      >
        <Bell className="h-[1.2rem] w-[1.2rem]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 rounded-xl border bg-card shadow-xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="font-semibold text-sm">Notificações</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                >
                  <CheckCheck className="w-3 h-3" /> Marcar todas
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading && (
                <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>
              )}
              {!loading && notifications.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">Sem notificações</div>
              )}
              {!loading && notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => { if (!n.read) markRead(n.id) }}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-muted/40 transition-colors",
                    !n.read && "bg-primary/5"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />}
                    <div className={cn("flex-1", n.read && "pl-4")}>
                      <p className="font-medium text-xs">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {new Date(n.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
