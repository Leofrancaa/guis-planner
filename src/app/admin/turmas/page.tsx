"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, XCircle, AlertCircle, Trash2, Users, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { fetchApi } from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface ClassGroupRequest {
  id: string
  name: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  createdAt: string
  requester: { id: string; name: string; username: string }
}

interface ClassGroup {
  id: string
  name: string
  createdAt: string
  institution?: { name: string }
  leader?: { id: string; name: string; username: string }
  _count?: { members: number }
}

type Tab = "requests" | "groups"

export default function AdminTurmasPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("requests")

  const [requests, setRequests] = useState<ClassGroupRequest[]>([])
  const [groups, setGroups] = useState<ClassGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState("")
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!user || user.role !== "ADMIN") { router.push("/"); return }
    Promise.all([
      fetchApi("/admin/class-group-requests").catch(() => []),
      fetchApi("/admin/class-groups").catch(() => []),
    ]).then(([reqs, grps]) => {
      setRequests(Array.isArray(reqs) ? reqs : [])
      setGroups(Array.isArray(grps) ? grps : [])
    }).finally(() => setLoading(false))
  }, [user, router])

  const handleApprove = async (id: string) => {
    setActionId(id)
    try {
      await fetchApi(`/admin/class-group-requests/${id}/approve`, { method: "PUT" })
      setRequests(prev => prev.filter(r => r.id !== id))
      const grps = await fetchApi("/admin/class-groups").catch(() => [])
      setGroups(Array.isArray(grps) ? grps : [])
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

  const handleDelete = async (id: string) => {
    setActionId(id)
    try {
      await fetchApi(`/admin/class-groups/${id}`, { method: "DELETE" })
      setGroups(prev => prev.filter(g => g.id !== id))
      setDeleteTarget(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao excluir turma.")
    } finally {
      setActionId(null)
    }
  }

  if (!user || user.role !== "ADMIN") return null

  const pending = requests.filter(r => r.status === "PENDING")

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Turmas</h1>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/30 rounded-xl p-1 w-fit">
        {([
          { key: "requests" as Tab, label: `Solicitações${pending.length ? ` (${pending.length})` : ""}` },
          { key: "groups" as Tab, label: `Turmas ativas (${groups.length})` },
        ] as { key: Tab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              tab === t.key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : tab === "requests" ? (
        pending.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhuma solicitação pendente.</div>
        ) : (
          <div className="space-y-3">
            {pending.map(req => (
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
                      <CheckCircle className="w-3.5 h-3.5" /> Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setRejectTarget(req.id)}
                      disabled={actionId === req.id}
                      className="gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Rejeitar
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
                        />
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => { setRejectTarget(null); setRejectNote("") }}>
                            Cancelar
                          </Button>
                          <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleReject(req.id)} disabled={actionId === req.id}>
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
        )
      ) : (
        groups.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhuma turma ativa.</div>
        ) : (
          <div className="space-y-3">
            {groups.map(group => (
              <motion.div
                key={group.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl p-4 border shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm">{group.name}</p>
                    {group.institution && (
                      <p className="text-xs text-muted-foreground mt-0.5">{group.institution.name}</p>
                    )}
                    {group.leader && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Crown className="w-3 h-3 text-amber-500" /> {group.leader.name}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Users className="w-3 h-3" /> {group._count?.members ?? 0} membros
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteTarget(group.id)}
                    disabled={actionId === group.id}
                    className="gap-1 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Excluir
                  </Button>
                </div>

                <AnimatePresence>
                  {deleteTarget === group.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-destructive font-medium mb-2">
                          Excluir permanentemente a turma <strong>{group.name}</strong>? Todos os membros, matérias e dados serão removidos.
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>
                            Cancelar
                          </Button>
                          <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleDelete(group.id)} disabled={actionId === group.id}>
                            Confirmar exclusão
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
