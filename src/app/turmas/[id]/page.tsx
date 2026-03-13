"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { Crown, Users, BookOpen, AlertTriangle, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useClassGroupStore, ClassGroupMember } from "@/store/classGroupStore"
import { useAuthStore } from "@/store/authStore"
import { cn } from "@/lib/utils"
import Link from "next/link"

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

  useEffect(() => {
    if (id) {
      fetchGroup(id)
      fetchMembers(id)
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
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Matérias desta turma</p>
            <Link href="/subjects">
              <Button size="sm" variant="outline">Ver Matérias</Button>
            </Link>
          </div>
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
