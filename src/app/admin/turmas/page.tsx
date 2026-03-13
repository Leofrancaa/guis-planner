"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { fetchApi } from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import { useRouter } from "next/navigation"

interface ClassGroupRequest {
  id: string
  name: string
  institutionId: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  createdAt: string
  requester: { id: string; name: string; username: string }
}

export default function AdminTurmasPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [requests, setRequests] = useState<ClassGroupRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState("")
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!user || user.role !== "ADMIN") { router.push("/"); return }
    fetchApi("/admin/class-group-requests")
      .then(setRequests)
      .catch(() => setError("Erro ao carregar solicitações."))
      .finally(() => setLoading(false))
  }, [user, router])

  const handleApprove = async (id: string) => {
    setActionId(id)
    try {
      await fetchApi(`/admin/class-group-requests/${id}/approve`, { method: "PUT" })
      setRequests(prev => prev.filter(r => r.id !== id))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao aprovar.")
    } finally {
      setActionId(null)
    }
  }

  const handleReject = async (id: string) => {
    setActionId(id)
    try {
      await fetchApi(`/admin/class-group-requests/${id}/reject`, {
        method: "PUT",
        body: JSON.stringify({ adminNote: rejectNote }),
      })
      setRequests(prev => prev.filter(r => r.id !== id))
      setRejectTarget(null)
      setRejectNote("")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao rejeitar.")
    } finally {
      setActionId(null)
    }
  }

  if (!user || user.role !== "ADMIN") return null

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Solicitações de Turma</h1>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : requests.filter(r => r.status === "PENDING").length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma solicitação pendente.
        </div>
      ) : (
        <div className="space-y-3">
          {requests.filter(r => r.status === "PENDING").map(req => (
            <motion.div
              key={req.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-card rounded-2xl p-4 border shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm">{req.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Solicitado por <strong>{req.requester.name}</strong> (@{req.requester.username})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(req.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(req.id)}
                    disabled={actionId === req.id}
                    className="gap-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setRejectTarget(req.id)}
                    disabled={actionId === req.id}
                    className="gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Rejeitar
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {rejectTarget === req.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <Input
                        placeholder="Motivo da rejeição (opcional)"
                        value={rejectNote}
                        onChange={e => setRejectNote(e.target.value)}
                        className="bg-background/50"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => { setRejectTarget(null); setRejectNote("") }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleReject(req.id)}
                          disabled={actionId === req.id}
                        >
                          Confirmar rejeição
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
