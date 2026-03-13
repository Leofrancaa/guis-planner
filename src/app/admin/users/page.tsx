"use client"

import { useEffect, useState } from "react"
import { Crown, Search, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { fetchApi } from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import { useRouter } from "next/navigation"

interface AdminUser {
  id: string
  name: string
  username: string
  role: string
  plan: "FREE" | "PREMIUM"
  premiumUntil: string | null
  points: number
}

export default function AdminUsersPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    if (!user || user.role !== "ADMIN") { router.push("/"); return }
    fetchApi("/admin/users")
      .then(setUsers)
      .catch(() => setError("Erro ao carregar usuários."))
      .finally(() => setLoading(false))
  }, [user, router])

  const handlePlanChange = async (userId: string, plan: "FREE" | "PREMIUM") => {
    setUpdating(userId)
    try {
      const premiumUntil = plan === "PREMIUM"
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null
      await fetchApi(`/admin/users/${userId}/plan`, {
        method: "PUT",
        body: JSON.stringify({ plan, premiumUntil }),
      })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan, premiumUntil } : u))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar plano.")
    } finally {
      setUpdating(null)
    }
  }

  if (!user || user.role !== "ADMIN") return null

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Usuários</h1>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou usuário..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-background/50"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(u => (
            <div
              key={u.id}
              className="flex items-center justify-between gap-3 bg-card rounded-xl p-3 border"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{u.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  @{u.username}
                  {u.role === "ADMIN" && <span className="text-[9px] bg-primary/10 text-primary px-1.5 rounded-full">Admin</span>}
                  <span className="text-[9px] text-muted-foreground/60">· {u.points} pts</span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {u.plan === "PREMIUM" && (
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                )}
                <Select
                  value={u.plan}
                  onValueChange={(v) => handlePlanChange(u.id, v as "FREE" | "PREMIUM")}
                  disabled={updating === u.id || u.role === "ADMIN"}
                >
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">Free</SelectItem>
                    <SelectItem value="PREMIUM">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">Nenhum usuário encontrado.</div>
          )}
        </div>
      )}
    </div>
  )
}
