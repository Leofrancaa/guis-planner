"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Crown, Users, BookOpen, AlertTriangle, X, AlertCircle, GraduationCap, CheckCircle, LogOut, Loader2, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useClassGroupStore, ClassGroupMember } from "@/store/classGroupStore"
import { useAuthStore } from "@/store/authStore"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { fetchApi } from "@/lib/api"
import { useToastStore } from "@/store/toastStore"
import { RatingModal } from "@/components/RatingModal"

interface TurmaSubject {
  id: string
  name: string
  professor: string
  color: string
  hours: number
  classStatus?: "ACTIVE" | "COMPLETED"
  isEnrolled: boolean
  enrollment?: { id: string; status: string } | null
}

type Tab = "subjects" | "members" | "ratings"

interface RatingAgg {
  professor: string
  totalRatings: number
  avgDidatica: number
  avgClareza: number
  avgDisponibilidade: number
  avgPontualidade: number
  avgDificuldade: number
}

interface MyRating {
  professor: string
  didatica: number
  clareza: number
  disponibilidade: number
  pontualidade: number
  dificuldade: number
}

function ReportModal({
  member,
  classGroupId,
  onClose,
}: {
  member: ClassGroupMember
  classGroupId: string
  onClose: () => void
}) {
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { reportMember } = useClassGroupStore()
  const addToast = useToastStore(state => state.addToast)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (reason.trim().length < 10) {
      setError("Descreva o motivo com pelo menos 10 caracteres.")
      return
    }
    setLoading(true)
    try {
      await reportMember(classGroupId, member.userId, reason)
      addToast("Denúncia enviada com sucesso.", "success")
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao enviar denúncia.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-2xl p-6 w-full max-w-md shadow-2xl border"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-destructive">Reportar Membro</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted/50">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Reportando: <strong>{member.user.name}</strong> (@{member.user.username})
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Motivo</label>
            <textarea
              required
              className="w-full min-h-[100px] rounded-xl border bg-background/50 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Descreva o comportamento inadequado..."
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" className="flex-1" disabled={loading}>
              {loading ? "Enviando..." : "Reportar"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function TurmaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tab, setTab] = useState<Tab>("subjects")
  const [reportTarget, setReportTarget] = useState<ClassGroupMember | null>(null)

  const { currentGroup, members, loading, fetchGroup, fetchMembers } = useClassGroupStore()
  const { user, isPremium } = useAuthStore()
  const addToast = useToastStore(state => state.addToast)

  const [subjects, setSubjects] = useState<TurmaSubject[]>([])
  const [subjectsLoading, setSubjectsLoading] = useState(false)
  const [enrollingId, setEnrollingId] = useState<string | null>(null)

  // Ratings
  const [ratingsMap, setRatingsMap] = useState<Record<string, RatingAgg[]>>({})
  const [myRatingsMap, setMyRatingsMap] = useState<Record<string, MyRating[]>>({})
  const [ratingsLoading, setRatingsLoading] = useState(false)
  const [ratingTarget, setRatingTarget] = useState<{ subject: TurmaSubject; existing: MyRating | null } | null>(null)

  const loadRatings = useCallback(async (subjectList: TurmaSubject[]) => {
    const enrolled = subjectList.filter(s => s.isEnrolled)
    if (enrolled.length === 0) return
    setRatingsLoading(true)
    try {
      const [aggResults, myResults] = await Promise.all([
        Promise.all(enrolled.map(s => fetchApi(`/ratings/subject/${s.id}`).catch(() => []))),
        Promise.all(enrolled.map(s => fetchApi(`/ratings/my/${s.id}`).catch(() => []))),
      ])
      const newAgg: Record<string, RatingAgg[]> = {}
      const newMy: Record<string, MyRating[]> = {}
      enrolled.forEach((s, i) => {
        newAgg[s.id] = aggResults[i]
        newMy[s.id] = myResults[i]
      })
      setRatingsMap(newAgg)
      setMyRatingsMap(newMy)
    } finally {
      setRatingsLoading(false)
    }
  }, [])

  const loadSubjects = useCallback(async () => {
    if (!id) return
    setSubjectsLoading(true)
    try {
      const data = await fetchApi(`/class-groups/${id}/subjects`)
      if (Array.isArray(data)) {
        setSubjects(data)
        loadRatings(data)
      }
    } catch {
      addToast("Erro ao carregar matérias.", "error")
    } finally {
      setSubjectsLoading(false)
    }
  }, [id, addToast, loadRatings])

  useEffect(() => {
    if (id) {
      fetchGroup(id)
      fetchMembers(id)
      loadSubjects()
    }
  }, [id, fetchGroup, fetchMembers, loadSubjects])

  const handleEnroll = async (subjectId: string) => {
    setEnrollingId(subjectId)
    try {
      await fetchApi(`/subjects/${subjectId}/enroll`, { method: "POST" })
      addToast("Matrícula realizada! A matéria agora aparece em Matérias.", "success")
      setSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, isEnrolled: true } : s))
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Erro ao se matricular.", "error")
    } finally {
      setEnrollingId(null)
    }
  }

  const handleUnenroll = async (subjectId: string) => {
    setEnrollingId(subjectId)
    try {
      await fetchApi(`/subjects/${subjectId}/enroll`, { method: "DELETE" })
      addToast("Matrícula cancelada.", "info")
      setSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, isEnrolled: false, enrollment: null } : s))
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Erro ao cancelar matrícula.", "error")
    } finally {
      setEnrollingId(null)
    }
  }

  const myRole = members.find(m => m.userId === user?.id)?.role ?? null
  const isLeader = myRole === "LEADER" || user?.role === "ADMIN"

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded-xl w-1/2" />
          <div className="h-4 bg-muted rounded-xl w-1/3" />
        </div>
      </div>
    )
  }

  if (!currentGroup) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center text-muted-foreground py-16">
        Turma não encontrada.
      </div>
    )
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "subjects", label: "Matérias", icon: BookOpen },
    { key: "members", label: "Membros", icon: Users },
    { key: "ratings", label: "Avaliações", icon: Star },
  ]

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{currentGroup.name}</h1>
        {currentGroup.leader && (
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
            <Crown className="w-4 h-4 text-amber-500" />
            Líder: {currentGroup.leader.name}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/30 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              tab === t.key
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Subjects tab */}
      {tab === "subjects" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Escolha as matérias que você vai cursar nesta turma.
            </p>
            {isLeader && (
              <Link href="/subjects">
                <Button size="sm" variant="outline" className="gap-1">
                  <BookOpen className="w-3.5 h-3.5" /> Gerenciar
                </Button>
              </Link>
            )}
          </div>

          {subjectsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhuma matéria cadastrada nesta turma.</p>
              {isLeader && (
                <Link href="/subjects">
                  <Button size="sm" variant="outline" className="mt-3">Adicionar matéria</Button>
                </Link>
              )}
            </div>
          ) : (
            <AnimatePresence>
              {subjects.map(subject => (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border bg-card transition-colors",
                    subject.isEnrolled && "border-primary/30 bg-primary/5"
                  )}
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: subject.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{subject.name}</p>
                    {subject.professor && (
                      <p className="text-xs text-muted-foreground truncate">{subject.professor}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{subject.hours}h</span>
                      {subject.classStatus === "COMPLETED" ? (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Concluída</span>
                      ) : (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">Ativa</span>
                      )}
                      {subject.isEnrolled && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                          <CheckCircle className="w-2.5 h-2.5" /> Matriculado
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {subject.classStatus === "COMPLETED" ? null : subject.isEnrolled ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-muted-foreground hover:text-destructive hover:border-destructive/50"
                        onClick={() => handleUnenroll(subject.id)}
                        disabled={enrollingId === subject.id}
                      >
                        {enrollingId === subject.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <LogOut className="w-3.5 h-3.5" />
                        )}
                        Sair
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="gap-1"
                        onClick={() => handleEnroll(subject.id)}
                        disabled={enrollingId === subject.id}
                      >
                        {enrollingId === subject.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <GraduationCap className="w-3.5 h-3.5" />
                        )}
                        Participar
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Members tab */}
      {tab === "members" && (
        <div className="space-y-2">
          {members.map(member => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-xl border bg-card"
            >
              <div>
                <p className="font-medium text-sm">{member.user.name}</p>
                <p className="text-xs text-muted-foreground">@{member.user.username}</p>
              </div>
              <div className="flex items-center gap-2">
                {member.role === "LEADER" && (
                  <span className="flex items-center gap-1 text-xs text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    <Crown className="w-3 h-3" /> Líder
                  </span>
                )}
                {isLeader && member.userId !== user?.id && member.role !== "LEADER" && (
                  <button
                    onClick={() => setReportTarget(member)}
                    className="text-xs text-destructive hover:bg-destructive/10 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors"
                  >
                    <AlertTriangle className="w-3 h-3" /> Reportar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ratings tab */}
      {tab === "ratings" && (
        <div className="space-y-4">
          {ratingsLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : subjects.filter(s => s.isEnrolled).length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Star className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Você precisa estar matriculado em pelo menos uma matéria para avaliar.</p>
            </div>
          ) : (
            subjects.filter(s => s.isEnrolled).map(subject => {
              const agg = ratingsMap[subject.id] ?? []
              const myList = myRatingsMap[subject.id] ?? []
              const myRating = myList.find(r => r.professor === subject.professor) ?? null
              return (
                <div key={subject.id} className="rounded-xl border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: subject.color }} />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{subject.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{subject.professor}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={myRating ? "outline" : "default"}
                      className="shrink-0 gap-1"
                      onClick={() => {
                        if (!isPremium()) {
                          addToast("A avaliação de professores é exclusiva para usuários Premium.", "error")
                          return
                        }
                        setRatingTarget({ subject, existing: myRating })
                      }}
                    >
                      <Star className="w-3.5 h-3.5" />
                      {myRating ? "Editar" : "Avaliar"}
                    </Button>
                  </div>

                  {agg.length > 0 && agg.map(r => (
                    <div key={r.professor} className="space-y-2 pt-1 border-t">
                      <p className="text-xs font-medium text-muted-foreground">{r.totalRatings} avaliação{r.totalRatings !== 1 ? "ões" : ""}</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                        {[
                          { label: "Didática",        val: r.avgDidatica,        max: 5 },
                          { label: "Clareza",          val: r.avgClareza,         max: 5 },
                          { label: "Disponibilidade",  val: r.avgDisponibilidade, max: 5 },
                          { label: "Pontualidade",     val: r.avgPontualidade,    max: 5 },
                          { label: "Dificuldade",      val: r.avgDificuldade,     max: 5 },
                        ].map(({ label, val, max }) => (
                          <div key={label} className="flex items-center justify-between gap-2">
                            <span className="text-xs text-muted-foreground">{label}</span>
                            <div className="flex items-center gap-1">
                              <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-400 rounded-full"
                                  style={{ width: `${(val / max) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium w-6 text-right">{val}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {myRating && (
                    <p className="text-xs text-primary flex items-center gap-1">
                      <Star className="w-3 h-3 fill-primary" /> Você já avaliou este professor
                    </p>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {reportTarget && (
        <ReportModal
          member={reportTarget}
          classGroupId={id}
          onClose={() => setReportTarget(null)}
        />
      )}

      <AnimatePresence>
        {ratingTarget && (
          <RatingModal
            subjectId={ratingTarget.subject.id}
            subjectName={ratingTarget.subject.name}
            professor={ratingTarget.subject.professor}
            existing={ratingTarget.existing}
            onClose={() => setRatingTarget(null)}
            onSuccess={() => loadRatings(subjects)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
