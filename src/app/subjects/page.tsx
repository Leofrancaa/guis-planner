"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useStore } from "@/store/useStore"
import { useAuthStore } from "@/store/authStore"
import { Subject, GradeConfig, EnrollmentStatus } from "@/types"
import { fetchApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { SkeletonCard } from "@/components/ui/skeleton"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
  Plus, BookOpen, Trash2, Edit2, Palette, Target,
  Calculator, AlertTriangle, CheckCircle2, TrendingUp, User, Users,
  Lock, XCircle, Award, Minus, Star
} from "lucide-react"

const COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e",
  "#10b981", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
  "#8b5cf6", "#d946ef", "#f43f5e"
]

const HOURS_OPTIONS = [
  { value: "30", label: "30h" },
  { value: "60", label: "60h" },
  { value: "90", label: "90h" },
  { value: "105", label: "105h" },
  { value: "120", label: "120h" },
  { value: "150", label: "150h" },
  { value: "180", label: "180h" },
  { value: "240", label: "240h" },
  { value: "300", label: "300h" },
  { value: "330", label: "330h" },
  { value: "360", label: "360h" },
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
}
const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 24 } }
}

function getMaxAbsences(hours: number): number {
  if (hours >= 300) return Math.ceil(hours / 40)
  return Math.floor(hours * 0.30)
}

function GradeMiniBar({ value, max = 10, color }: { value: number | null; max?: number; color: string }) {
  if (value === null || value === undefined) return <div className="h-1.5 w-full bg-muted rounded-full" />
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  )
}

function AbsenceBar({ absences, maxAbsences, color }: { absences: number; maxAbsences: number; color: string }) {
  const pct = Math.min((absences / maxAbsences) * 100, 100)
  const isWarning = pct >= 70
  const isDanger = pct >= 100
  const barColor = isDanger ? "#ef4444" : isWarning ? "#f59e0b" : color
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground flex items-center gap-1">
          <Calculator className="w-3 h-3" />
          Faltas: {absences}/{maxAbsences}
        </span>
        {isDanger && <span className="text-red-500 font-medium">Limite atingido!</span>}
        {isWarning && !isDanger && <span className="text-amber-500 font-medium">Atenção!</span>}
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full transition-colors"
          style={{ backgroundColor: barColor }}
        />
      </div>
    </div>
  )
}

function calculateGradeStatus(subject: Subject) {
  const configs = subject.enrollments?.[0]?.gradeConfigs || []
  if (configs.length === 0) return { label: "Sem notas", icon: null, color: "text-muted-foreground", avg: null }
  
  const graded = configs.filter(c => c.grade !== null)
  if (graded.length === 0) return { label: "Aguardando notas", icon: null, color: "text-muted-foreground", avg: null }

  const gradedWeightSum = graded.reduce((sum, c) => sum + c.weight, 0)
  const gradedScore = graded.reduce((sum, c) => sum + ((c.grade || 0) * c.weight / 100), 0)
  const currentAverage = gradedWeightSum > 0 ? (gradedScore / (gradedWeightSum / 100)) : 0

  if (graded.length === configs.length) {
    if (currentAverage >= 7) return { label: `Aprovado (${currentAverage.toFixed(1)})`, icon: CheckCircle2, color: "text-emerald-500", avg: currentAverage }
    return { label: `Reprovado (${currentAverage.toFixed(1)})`, icon: AlertTriangle, color: "text-red-500", avg: currentAverage }
  }

  const remainingWeight = 100 - gradedWeightSum
  const neededScore = 7.0 - gradedScore
  const neededOnRemaining = (neededScore / (remainingWeight / 100))

  if (neededOnRemaining <= 0) return { label: `Média atual: ${currentAverage.toFixed(1)} (Aprovado!)`, icon: CheckCircle2, color: "text-emerald-500", avg: currentAverage }
  if (neededOnRemaining > 10) return { label: `Média: ${currentAverage.toFixed(1)} (Trajetória difícil)`, icon: AlertTriangle, color: "text-red-500", avg: currentAverage }
  
  return { label: `Precisa ${neededOnRemaining.toFixed(1)} na média restante`, icon: TrendingUp, color: "text-amber-500", avg: currentAverage }
}

const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  ENROLLED: "Cursando",
  APPROVED: "Aprovado",
  FAILED: "Reprovado",
  LOCKED: "Trancado",
}

const ENROLLMENT_STATUS_COLORS: Record<EnrollmentStatus, string> = {
  ENROLLED: "text-blue-500 bg-blue-500/10",
  APPROVED: "text-emerald-500 bg-emerald-500/10",
  FAILED: "text-red-500 bg-red-500/10",
  LOCKED: "text-muted-foreground bg-muted",
}

function EnrollmentBadge({ status }: { status: EnrollmentStatus }) {
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${ENROLLMENT_STATUS_COLORS[status]}`}>
      {ENROLLMENT_STATUS_LABELS[status]}
    </span>
  )
}

function GradeConfigModal({
  subject,
  onClose,
}: {
  subject: Subject
  onClose: () => void
}) {
  const [configs, setConfigs] = React.useState<Array<{ label: string; weight: string; grade: string }>>([
    { label: "AV1", weight: "33.4", grade: "" },
    { label: "AV2", weight: "33.3", grade: "" },
    { label: "AV3", weight: "33.3", grade: "" },
  ])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState("")
  const [currentAverage, setCurrentAverage] = React.useState<number | null>(null)
  const [neededForPass, setNeededForPass] = React.useState<number | null>(null)

  React.useEffect(() => {
    fetchApi(`/subjects/${subject.id}/grade-config`)
      .then((data) => {
        if (data.configs && data.configs.length > 0) {
          setConfigs(data.configs.map((c: GradeConfig) => ({
            label: c.label,
            weight: c.weight.toString(),
            grade: c.grade != null ? c.grade.toString() : "",
          })))
        }
        setCurrentAverage(data.currentAverage)
        setNeededForPass(data.neededForPass)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [subject.id])

  const totalWeight = configs.reduce((sum, c) => sum + (parseFloat(c.weight) || 0), 0)
  const weightOk = Math.abs(totalWeight - 100) < 0.1

  const addRow = () => setConfigs(prev => [...prev, { label: "", weight: "", grade: "" }])
  const removeRow = (i: number) => setConfigs(prev => prev.filter((_, idx) => idx !== i))
  const update = (i: number, field: "label" | "weight" | "grade", val: string) => {
    setConfigs(prev => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: val }
      return next
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!weightOk) { setError("A soma dos pesos deve ser exatamente 100%."); return }
    setSaving(true)
    setError("")
    try {
      await fetchApi(`/subjects/${subject.id}/grade-config`, {
        method: "PUT",
        body: JSON.stringify({
          configs: configs.map((c, i) => ({
            label: c.label,
            weight: parseFloat(c.weight),
            order: i,
            grade: c.grade ? parseFloat(c.grade) : null,
          })),
        }),
      })
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-2xl p-6 w-full max-w-lg shadow-2xl border max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">Notas — {subject.name}</h2>
            {currentAverage != null && (
              <p className="text-sm text-muted-foreground">Média atual: <strong>{currentAverage.toFixed(1)}</strong></p>
            )}
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted/50">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {neededForPass != null && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-600 dark:text-amber-400">
            Você precisa de <strong>{neededForPass.toFixed(1)}</strong> na próxima avaliação para passar (média 7.0).
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2">{error}</div>
            )}

            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_80px_80px_32px] gap-2 text-xs text-muted-foreground px-1">
                <span>Avaliação</span><span>Peso (%)</span><span>Nota</span><span />
              </div>
              {configs.map((c, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_80px_32px] gap-2 items-center">
                  <input
                    className="rounded-lg border bg-background/50 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="AV1"
                    value={c.label}
                    onChange={e => update(i, "label", e.target.value)}
                    required
                  />
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="100"
                    className="rounded-lg border bg-background/50 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="33.3"
                    value={c.weight}
                    onChange={e => update(i, "weight", e.target.value)}
                    required
                  />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    className="rounded-lg border bg-background/50 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="–"
                    value={c.grade}
                    onChange={e => update(i, "grade", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="p-1 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={addRow}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Adicionar avaliação
              </button>
              <span className={`text-xs font-medium ${weightOk ? "text-emerald-500" : "text-amber-500"}`}>
                Total: {totalWeight.toFixed(1)}%
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={saving || !weightOk}>
                {saving ? "Salvando..." : "Salvar Notas"}
              </Button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  )
}

interface LeaderGroup { id: string; name: string }

export default function SubjectsPage() {
  const { subjects, loading, addSubject, updateSubject, deleteSubject, fetchSubjects } = useStore()
  const { isPremium } = useAuthStore()
  const [mounted, setMounted] = React.useState(false)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isTrackingModalOpen, setIsTrackingModalOpen] = React.useState(false)
  const [gradeConfigSubject, setGradeConfigSubject] = React.useState<Subject | null>(null)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [trackingSubjectId, setTrackingSubjectId] = React.useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null)

  // Leader turmas (for scope selector)
  const [leaderGroups, setLeaderGroups] = React.useState<LeaderGroup[]>([])
  const [selectedGroupId, setSelectedGroupId] = React.useState<string>("")

  // Form state
  const [name, setName] = React.useState("")
  const [professor, setProfessor] = React.useState("")
  const [hours, setHours] = React.useState("60")
  const [color, setColor] = React.useState(COLORS[7])
  const [scope, setScope] = React.useState<"INDIVIDUAL" | "CLASS">("INDIVIDUAL")

  // Tracking form
  const [av1, setAv1] = React.useState("")
  const [av2, setAv2] = React.useState("")
  const [av3, setAv3] = React.useState("")
  const [absences, setAbsences] = React.useState("0")

  React.useEffect(() => {
    setMounted(true)
    fetchSubjects()
    // Fetch groups where user is leader
    fetchApi("/class-groups")
      .then((groups: { id: string; name: string; myRole?: string }[]) => {
        if (Array.isArray(groups)) {
          const leader = groups.filter(g => g.myRole === "LEADER")
          setLeaderGroups(leader)
          if (leader.length > 0) {
            setSelectedGroupId(leader[0].id)
            setScope("CLASS") // default to CLASS for leaders
          }
        }
      })
      .catch(() => {})
  }, [fetchSubjects])

  if (!mounted) return null

  const resetForm = () => {
    setName(""); setProfessor(""); setHours("60"); setColor(COLORS[7])
    setScope("INDIVIDUAL"); setEditingId(null)
  }

  const openAddModal = () => { resetForm(); setIsModalOpen(true) }

  const openEditModal = (subject: Subject) => {
    setName(subject.name)
    setProfessor(subject.professor || "")
    setHours(subject.hours?.toString() || "60")
    setColor(subject.color)
    setEditingId(subject.id)
    setIsModalOpen(true)
  }

  const openTrackingModal = (subject: Subject) => {
    const t = subject.studentSubjects?.[0]
    setAv1(t?.av1?.toString() || "")
    setAv2(t?.av2?.toString() || "")
    setAv3(t?.av3?.toString() || "")
    setAbsences(t?.absences?.toString() || "0")
    setTrackingSubjectId(subject.id)
    setIsTrackingModalOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const data: Record<string, unknown> = { name, professor, hours: hours ? parseInt(hours) : 60, color, scope }
    if (scope === "CLASS" && selectedGroupId) data.classGroupId = selectedGroupId
    if (editingId) {
      updateSubject(editingId, data)
    } else {
      addSubject(data)
    }
    setIsModalOpen(false)
    resetForm()
  }

  const handleSaveTracking = (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingSubjectId) return
    useStore.getState().updateSubjectTracking(trackingSubjectId, {
      absences: parseInt(absences) || 0,
      av1: av1 ? parseFloat(av1) : null,
      av2: av2 ? parseFloat(av2) : null,
      av3: av3 ? parseFloat(av3) : null,
    })
    setIsTrackingModalOpen(false)
  }

  const handleDelete = (id: string) => {
    deleteSubject(id)
    setConfirmDeleteId(null)
  }

  const trackingSubject = subjects.find(s => s.id === trackingSubjectId)
  const trackingMaxAbsences = trackingSubject?.hours ? getMaxAbsences(trackingSubject.hours) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="p-5 sm:p-8 space-y-8 max-w-5xl mx-auto"
    >
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Matérias</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus cursos e acompanhe seu desempenho.</p>
        </div>
        <Button onClick={openAddModal} className="shrink-0 gap-2 shadow-lg">
          <Plus className="w-4 h-4" /> Nova Matéria
        </Button>
      </header>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mb-4">
            <BookOpen className="w-9 h-9 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-bold mb-2">Nenhuma matéria ainda</h3>
          <p className="text-muted-foreground mb-6 max-w-sm text-sm">
            Adicione sua primeira matéria para começar a organizar notas, tarefas e provas.
          </p>
          <Button onClick={openAddModal} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" /> Adicionar Matéria
          </Button>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {subjects.map((subject) => {
            const tracking = subject.studentSubjects?.[0]
            const gradeStatus = calculateGradeStatus(subject)
            const GradeIcon = gradeStatus.icon
            const maxAbsences = subject.hours ? getMaxAbsences(subject.hours) : 0
            const assessments = subject.enrollments?.[0]?.gradeConfigs || []

            return (
              <motion.div
                key={subject.id}
                variants={cardVariants}
                whileHover={{ y: -3 }}
                className="glass-card-elevated rounded-2xl overflow-hidden flex flex-col group"
                style={{ borderTop: `4px solid ${subject.color}` }}
              >
                <div className="p-5 flex-1 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base leading-tight truncate" title={subject.name}>
                        {subject.name}
                      </h3>
                      {subject.professor && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <User className="w-3 h-3" /> {subject.professor}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => openEditModal(subject)}
                        className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-muted transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(subject.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-muted transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Enrollment + class status badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {subject.classGroup && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        <Users className="w-2.5 h-2.5" />
                        {subject.classGroup.name}
                      </span>
                    )}
                    {subject.classStatus === "COMPLETED" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        <Lock className="w-2.5 h-2.5" /> Concluída
                      </span>
                    )}
                    {subject.enrollments?.[0]?.status && (
                      <EnrollmentBadge status={subject.enrollments[0].status} />
                    )}
                  </div>

                  {/* Info row */}
                  {subject.hours && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="px-2 py-0.5 bg-muted rounded-full">{subject.hours}h</span>
                      <span className="px-2 py-0.5 bg-muted rounded-full">Máx. {maxAbsences} faltas</span>
                    </div>
                  )}

                  {/* Absence progress bar */}
                  {tracking && maxAbsences > 0 && (
                    <AbsenceBar
                      absences={tracking.absences}
                      maxAbsences={maxAbsences}
                      color={subject.color}
                    />
                  )}

                  {/* Grade bars (Dynamic or Legacy) */}
                  <div className="space-y-2 pt-1">
                    {assessments.length > 0 ? (
                      assessments.map((config) => (
                        <div key={config.id} className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground w-10 shrink-0 truncate" title={config.label}>
                            {config.label}
                          </span>
                          <GradeMiniBar value={config.grade} color={subject.color} />
                          <span className="text-[10px] font-medium w-6 text-right shrink-0">
                            {config.grade !== null && config.grade !== undefined ? config.grade.toFixed(1) : "–"}
                          </span>
                        </div>
                      ))
                    ) : tracking ? (
                      [{ label: "AV1", val: tracking.av1 }, { label: "AV2", val: tracking.av2 }, { label: "AV3", val: tracking.av3 }].map(({ label, val }) => (
                        <div key={label} className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground w-6 shrink-0">{label}</span>
                          <GradeMiniBar value={val} color={subject.color} />
                          <span className="text-[10px] font-medium w-6 text-right shrink-0">
                            {val !== null && val !== undefined ? val.toFixed(1) : "–"}
                          </span>
                        </div>
                      ))
                    ) : null}
                  </div>

                  {/* Grade status */}
                  {gradeStatus.label !== "Sem notas" && (
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${gradeStatus.color}`}>
                      {GradeIcon && <GradeIcon className="w-3.5 h-3.5" />}
                      {gradeStatus.label}
                    </div>
                  )}
                </div>

                {/* Delete confirmation inline */}
                <AnimatePresence>
                  {confirmDeleteId === subject.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-destructive/30 bg-destructive/5 px-4 py-3"
                    >
                      <p className="text-xs text-destructive font-medium mb-2">Remover esta matéria?</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive" className="flex-1 h-7 text-xs" onClick={() => handleDelete(subject.id)}>
                          Confirmar
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => setConfirmDeleteId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer */}
                <div className="px-5 pb-4 pt-3 border-t border-border/40 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 text-xs gap-1.5 h-8 min-w-[80px]"
                    onClick={() => setGradeConfigSubject(subject)}
                  >
                    <Award className="w-3 h-3" /> Notas
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-xs gap-1.5 h-8 min-w-[80px]"
                    onClick={() => openTrackingModal(subject)}
                  >
                    <Target className="w-3 h-3" /> Faltas
                  </Button>
                  {subject.professor && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs gap-1.5 h-8 mt-1 border-primary/20 hover:bg-primary/5 text-primary"
                      onClick={() => {
                        if (isPremium()) {
                          // TODO: Abrir modal de avaliação
                          alert("Acessando Avaliação de Professor...")
                        } else {
                          alert("A avaliação de professores é um recurso exclusivo Premium.")
                        }
                      }}
                    >
                      <Star className="w-3 h-3" /> Avaliar Professor
                    </Button>
                  )}
                  {/* Move to turma button for leaders with individual subjects */}
                  {leaderGroups.length > 0 && !subject.classGroup && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs gap-1.5 h-8 mt-1 border-primary/20 hover:bg-primary/5 text-primary"
                      onClick={async () => {
                        const groupId = leaderGroups[0].id
                        try {
                          await fetchApi(`/subjects/${subject.id}/assign-class`, {
                            method: "PUT",
                            body: JSON.stringify({ classGroupId: groupId }),
                          })
                          fetchSubjects()
                        } catch {
                          alert("Erro ao mover matéria para a turma.")
                        }
                      }}
                    >
                      <Users className="w-3 h-3" /> Mover para Turma
                    </Button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Add/Edit Subject Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Editar Matéria" : "Nova Matéria"}
        description={editingId ? "Atualize os dados do seu curso." : "Crie uma nova matéria para gerenciar agenda e notas."}
      >
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome <span className="text-destructive">*</span></label>
            <Input required placeholder="ex: Cálculo I" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Professor</label>
              <Input placeholder="ex: Dr. Silva" value={professor} onChange={e => setProfessor(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Carga Horária</label>
              <Select value={hours} onValueChange={setHours}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {HOURS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label} {opt.value ? `→ máx. ${getMaxAbsences(parseInt(opt.value))} faltas` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Scope selector - shown when user is leader of at least one turma */}
          {!editingId && leaderGroups.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Visibilidade</label>
              <Select value={scope} onValueChange={(v) => setScope(v as "INDIVIDUAL" | "CLASS")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INDIVIDUAL">Somente eu</SelectItem>
                  <SelectItem value="CLASS">
                    <span className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" /> Turma
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {scope === "CLASS" && (
                <>
                  {leaderGroups.length > 1 && (
                    <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a turma" />
                      </SelectTrigger>
                      <SelectContent>
                        {leaderGroups.map(g => (
                          <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-muted-foreground">
                    A matéria ficará visível para todos da turma. Provas e notas permanecem individuais.
                  </p>
                </>
              )}
            </div>
          )}

          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Palette className="w-4 h-4" /> Cor
            </label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? "border-foreground scale-110 shadow-md" : "border-transparent hover:scale-110"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit">{editingId ? "Salvar" : "Criar Matéria"}</Button>
          </div>
        </form>
      </Modal>

      {/* Grade Config Modal */}
      <AnimatePresence>
        {gradeConfigSubject && (
          <GradeConfigModal
            subject={gradeConfigSubject}
            onClose={() => { setGradeConfigSubject(null); fetchSubjects() }}
          />
        )}
      </AnimatePresence>

      {/* Tracking Modal */}
      <Modal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
        title="Notas e Faltas"
        description="Registre suas notas para acompanhar seu desempenho."
      >
        <form onSubmit={handleSaveTracking} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center justify-between">
              <span>Faltas</span>
              {trackingMaxAbsences > 0 && (
                <span className="text-xs text-muted-foreground font-normal">
                  Máximo permitido: <strong>{trackingMaxAbsences}</strong>
                </span>
              )}
            </label>
            <Input
              type="number"
              min="0"
              max={trackingMaxAbsences || undefined}
              value={absences}
              onChange={e => setAbsences(e.target.value)}
            />
            {trackingMaxAbsences > 0 && parseInt(absences) > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{parseInt(absences)} faltas</span>
                  <span>{Math.round((parseInt(absences) / trackingMaxAbsences) * 100)}% do limite</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min((parseInt(absences) / trackingMaxAbsences) * 100, 100)}%`,
                      backgroundColor: parseInt(absences) >= trackingMaxAbsences
                        ? "#ef4444"
                        : parseInt(absences) >= trackingMaxAbsences * 0.7
                        ? "#f59e0b"
                        : "#22c55e"
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[{ label: "AV1", val: av1, set: setAv1 }, { label: "AV2", val: av2, set: setAv2 }, { label: "AV3", val: av3, set: setAv3 }].map(({ label, val, set }) => (
              <div key={label} className="space-y-2">
                <label className="text-sm font-medium">{label}</label>
                <Input type="number" step="0.1" min="0" max="10" placeholder="0.0" value={val} onChange={e => set(e.target.value)} />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsTrackingModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  )
}
