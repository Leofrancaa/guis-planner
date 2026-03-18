"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { Crown, Users, BookOpen, AlertTriangle, X, AlertCircle, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useClassGroupStore, ClassGroupMember } from "@/store/classGroupStore"
import { useAuthStore } from "@/store/authStore"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { fetchApi } from "@/lib/api"

interface ClassSubject {
  id: string
  name: string
  professor: string
  color: string
  hours: number
  classStatus?: "ACTIVE" | "COMPLETED"
}

type Tab = "subjects" | "members"

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (reason.trim().length < 10) {
      setError("Descreva o motivo com pelo menos 10 caracteres.")
      return
    }
    setLoading(true)
    try {
      await reportMember(classGroupId, member.userId, reason)
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
  const { user } = useAuthStore()
  const [subjects, setSubjects] = useState<ClassSubject[]>([])
  const [subjectsLoading, setSubjectsLoading] = useState(false)

  useEffect(() => {
    if (id) {
      fetchGroup(id)
      fetchMembers(id)
      setSubjectsLoading(true)
      fetchApi("/subjects")
        .then((all: ClassSubject[]) => {
          // The API already filters by membership; just filter for this turma
          if (Array.isArray(all)) {
            setSubjects(all.filter((s: any) => s.classGroupId === id))
          }
        })
        .catch(() => {})
        .finally(() => setSubjectsLoading(false))
    }
  }, [id, fetchGroup, fetchMembers])

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
          {isLeader && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Matérias desta turma</p>
              <Link href="/subjects">
                <Button size="sm" variant="outline" className="gap-1">
                  <BookOpen className="w-3.5 h-3.5" /> Gerenciar Matérias
                </Button>
              </Link>
            </div>
          )}

          {subjectsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}
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
            <div className="space-y-2">
              {subjects.map(subject => (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3 rounded-xl border bg-card"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: subject.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{subject.name}</p>
                    {subject.professor && (
                      <p className="text-xs text-muted-foreground truncate">{subject.professor}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {subject.classStatus === "COMPLETED" ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">Concluída</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">Ativa</span>
                    )}
                    <span className="text-xs text-muted-foreground">{subject.hours}h</span>
                  </div>
                </motion.div>
              ))}
            </div>
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

      {reportTarget && (
        <ReportModal
          member={reportTarget}
          classGroupId={id}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  )
}
