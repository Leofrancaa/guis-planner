"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, BookOpen, Calendar, StickyNote, LogOut, Bell, BellOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuthStore } from "@/store/authStore"
import { isPushSupported, subscribeToPush, unsubscribeFromPush, isSubscribed } from "@/lib/push"
import { useToastStore } from "@/store/toastStore"

const navItems = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Matérias", href: "/subjects", icon: BookOpen },
  { name: "Agenda", href: "/agenda", icon: Calendar },
  { name: "Notas", href: "/notes", icon: StickyNote },
]

function UserAvatar({ name }: { name?: string | null }) {
  const initials = name
    ? name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "?"
  return (
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold shadow-sm shrink-0">
      {initials}
    </div>
  )
}

function BellButton() {
  const [subscribed, setSubscribed] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const addToast = useToastStore(state => state.addToast)

  React.useEffect(() => {
    isSubscribed().then(setSubscribed)
  }, [])

  if (!isPushSupported()) return null

  const handleToggle = async () => {
    setLoading(true)
    try {
      if (subscribed) {
        await unsubscribeFromPush()
        setSubscribed(false)
        addToast('Notificações desativadas.', 'info')
      } else {
        const ok = await subscribeToPush()
        if (ok) {
          setSubscribed(true)
          addToast('Notificações ativadas!', 'success')
        } else {
          addToast('Permissão negada para notificações.', 'error')
        }
      }
    } catch {
      addToast('Erro ao configurar notificações.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={subscribed ? 'Desativar notificações' : 'Ativar notificações'}
      className={cn(
        "relative rounded-full w-10 h-10 flex items-center justify-center hover:bg-muted/50 transition-colors",
        loading && "opacity-50 cursor-wait"
      )}
    >
      {subscribed ? (
        <Bell className="h-[1.2rem] w-[1.2rem] text-primary" />
      ) : (
        <>
          <BellOff className="h-[1.2rem] w-[1.2rem] text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
        </>
      )}
    </button>
  )
}

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  if (pathname === "/login" || pathname === "/register") return null

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 z-50 w-full border-t bg-background/80 backdrop-blur-md pb-safe sm:hidden">
        <div className="flex justify-around items-center p-2 relative">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center p-2 rounded-xl transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:bg-muted/50"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="bubble-mobile"
                    className="absolute inset-0 z-10 bg-primary/10 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon className="h-6 w-6 z-20" />
                <span className="text-[10px] font-medium mt-1 z-20">{item.name}</span>
              </Link>
            )
          })}
          <div className="absolute top-[-3.5rem] right-4 bg-background/80 backdrop-blur-md rounded-full shadow-lg border">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Desktop sidebar */}
      <motion.nav
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="hidden sm:flex flex-col h-screen w-64 border-r bg-card/50 backdrop-blur-xl shrink-0 sticky top-0 shadow-sm"
      >
        {/* App title + actions */}
        <div className="p-6 flex justify-between items-center border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-black text-sm tracking-tight shrink-0">
              GP
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Guis Planner
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <BellButton />
            <ThemeToggle />
          </div>
        </div>

        {/* User info */}
        {user && (
          <div className="px-4 py-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <UserAvatar name={user.name} />
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav links */}
        <div className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-4 py-2.5 transition-colors text-sm",
                  isActive ? "text-primary font-medium" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="bubble-desktop"
                    className="absolute inset-0.5 z-10 bg-primary/10 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon className="h-4 w-4 z-20 shrink-0" />
                <span className="z-20">{item.name}</span>
              </Link>
            )
          })}
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-border/50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full rounded-xl px-4 py-2.5 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sair</span>
          </button>
        </div>
      </motion.nav>
    </>
  )
}
