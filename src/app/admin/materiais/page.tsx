"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, XCircle, FileText, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { fetchApi } from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import { useRouter } from "next/navigation"

interface Material {
  id: string
  subjectName: string
  professor: string
  course: string
  semester: string
  type: "EXAM" | "EXERCISE_LIST" | "SUMMARY"
  status: "PENDING" | "APPROVED" | "REJECTED"
  fileUrl: string
  createdAt: string
  uploader: { id: string; name: string; username: string }
}

const TYPE_LABELS: Record<string, string> = {
  EXAM: "Prova",
  EXERCISE_LIST: "Lista de Exercícios",
  SUMMARY: "Resumo",
}

export default function AdminMateriaisPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState("")
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!user || user.role !== "ADMIN") { router.push("/"); return }
    fetchApi("/admin/materials?status=PENDING")
      .then(setMaterials)
      .catch(() => setError("Erro ao carregar materiais."))
      .finally(() => setLoading(false))
  }, [user, router])

  const handleApprove = async (id: string) => {
    setActionId(id)
    try {
      await fetchApi(`/admin/materials/${id}/approve`, { method: "PUT" })
      setMaterials(prev => prev.filter(m => m.id !== id))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao aprovar.")
    } finally {
      setActionId(null)
    }
  }

  const handleReject = async (id: string) => {
    setActionId(id)
    try {
      await fetchApi(`/admin/materials/${id}/reject`, {
        method: "PUT",
        body: JSON.stringify({ adminNote: rejectNote }),
      })
      setMaterials(prev => prev.filter(m => m.id !== id))
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
      <h1 className="text-2xl font-bold">Validação de Materiais</h1>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum material pendente de validação.
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map(mat => (
            <motion.div
              key={mat.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-card rounded-2xl p-4 border shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <p className="font-semibold text-sm truncate">{mat.subjectName}</p>
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full shrink-0">
                      {TYPE_LABELS[mat.type]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {mat.professor} · {mat.course} · {mat.semester}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Enviado por <strong>{mat.uploader.name}</strong> · {new Date(mat.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                  <a
                    href={mat.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-1 inline-block"
                  >
                    Ver arquivo →
                  </a>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(mat.id)}
                    disabled={actionId === mat.id}
                    className="gap-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setRejectTarget(mat.id)}
                    disabled={actionId === mat.id}
                    className="gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Rejeitar
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {rejectTarget === mat.id && (
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
                        <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleReject(mat.id)} disabled={actionId === mat.id}>
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
