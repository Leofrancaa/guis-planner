"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Users, Building2, BookOpen, FileText, Flag } from "lucide-react"
import { fetchApi } from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import { useRouter } from "next/navigation"

interface AdminStats {
  pendingRequests: number
  pendingMaterials: number
  openReports: number
}

const modules = [
  { href: "/admin/turmas", icon: Users, label: "Turmas", desc: "Aprovar/rejeitar solicitações de turmas", badgeKey: "pendingRequests" as const },
  { href: "/admin/materiais", icon: FileText, label: "Materiais", desc: "Validar materiais enviados pelos usuários", badgeKey: "pendingMaterials" as const },
  { href: "/admin/reports", icon: Flag, label: "Denúncias", desc: "Gerenciar relatórios de comportamento", badgeKey: "openReports" as const },
  { href: "/admin/users", icon: BookOpen, label: "Usuários", desc: "Gerenciar planos e papéis de usuários", badgeKey: null },
  { href: "/admin/institutions", icon: Building2, label: "Instituições", desc: "Adicionar novas instituições de ensino", badgeKey: null },
]

export default function AdminPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats>({ pendingRequests: 0, pendingMaterials: 0, openReports: 0 })

  useEffect(() => {
    if (!user || user.role !== "ADMIN") { router.push("/"); return }
    Promise.all([
      fetchApi("/admin/class-group-requests?status=PENDING").catch(() => []),
      fetchApi("/admin/materials?status=PENDING").catch(() => []),
      fetchApi("/admin/reports?status=OPEN").catch(() => []),
    ]).then(([reqs, mats, reps]) => {
      setStats({
        pendingRequests: Array.isArray(reqs) ? reqs.length : 0,
        pendingMaterials: Array.isArray(mats) ? mats.length : 0,
        openReports: Array.isArray(reps) ? reps.length : 0,
      })
    })
  }, [user, router])

  if (!user || user.role !== "ADMIN") return null

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Painel Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie a plataforma Guis Planner</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {modules.map(m => {
          const badge = m.badgeKey ? stats[m.badgeKey] : 0
          return (
            <Link
              key={m.href}
              href={m.href}
              className="relative bg-card rounded-2xl p-5 border shadow-sm hover:shadow-md transition-shadow flex items-start gap-4"
            >
              <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                <m.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">{m.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
              </div>
              {badge > 0 && (
                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
