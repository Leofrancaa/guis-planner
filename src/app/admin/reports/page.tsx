"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { AlertTriangle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { fetchApi } from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import { useRouter } from "next/navigation"

interface Report {
  id: string
  reason: string
  status: "OPEN" | "WARNED" | "REMOVED" | "BANNED"
  adminNote?: string
  createdAt: string
  reporter: { id: string; name: string; username: string }
  reported: { id: string; name: string; username: string }
  classGroup: { id: string; name: string }
}

export default function AdminReportsPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [note, setNote] = useState<Record<string, string>>({})
  const [actionId, setActionId] = useState<string | null>(null)

  useEffect(() => {
    if (!user || user.role !== "ADMIN") { router.push("/"); return }
    fetchApi("/admin/reports?status=OPEN")
      .then(setReports)
      .catch(() => setError("Erro ao carregar denúncias."))
      .finally(() => setLoading(false))
  }, [user, router])

  const handleAction = async (id: string, action: "warn" | "remove" | "ban") => {
    setActionId(id)
    try {
      await fetchApi(`/admin/reports/${id}/${action}`, {
        method: "PUT",
        body: JSON.stringify({ adminNote: note[id] || "" }),
      })
      setReports(prev => prev.filter(r => r.id !== id))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao executar ação.")
    } finally {
      setActionId(null)
    }
  }

  if (!user || user.role !== "ADMIN") return null

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Denúncias</h1>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-32 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Nenhuma denúncia aberta.</div>
      ) : (
        <div className="space-y-4">
          {reports.map(rep => (
            <motion.div
              key={rep.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl p-4 border shadow-sm space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-destructive/10 shrink-0">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">
                    Denúncia contra <strong>{rep.reported.name}</strong> (@{rep.reported.username})
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Turma: {rep.classGroup.name} · Reportado por: {rep.reporter.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 bg-muted rounded-lg px-2 py-1">
                    {rep.reason}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(rep.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              <Input
                placeholder="Nota do admin (opcional)"
                value={note[rep.id] || ""}
                onChange={e => setNote(prev => ({ ...prev, [rep.id]: e.target.value }))}
                className="bg-background/50"
              />

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950"
                  onClick={() => handleAction(rep.id, "warn")}
                  disabled={actionId === rep.id}
                >
                  Advertir
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950"
                  onClick={() => handleAction(rep.id, "remove")}
                  disabled={actionId === rep.id}
                >
                  Remover da Turma
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleAction(rep.id, "ban")}
                  disabled={actionId === rep.id}
                >
                  Banir
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
