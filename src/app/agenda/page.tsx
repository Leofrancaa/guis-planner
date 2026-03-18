"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useStore } from "@/store/useStore"
import { useClassGroupStore } from "@/store/classGroupStore"
import { Event, EventType } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { SkeletonCard } from "@/components/ui/skeleton"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Plus, CheckCircle2, Circle, Trash2,
  Search, Filter, CalendarCheck, X, AlertTriangle
} from "lucide-react"
import { format, parseISO, isToday, isTomorrow } from "date-fns"

const EVENT_TYPE_CONFIG: Record<EventType, { label: string; classes: string }> = {
  exam:       { label: "Prova",  classes: "bg-red-600 text-white" },
  assignment: { label: "Tarefa", classes: "bg-blue-600 text-white" },
  class:      { label: "Aula",   classes: "bg-emerald-600 text-white" },
  other:      { label: "Outro",  classes: "bg-zinc-500 text-white" },
}

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 26 } },
  exit: { opacity: 0, x: -8, transition: { duration: 0.15 } }
}

export default function AgendaPage() {
  const { events, subjects, loading, addEvent, deleteEvent, toggleEventCompletion, fetchEvents, fetchSubjects } = useStore()
  const { classGroups, fetchClassGroups } = useClassGroupStore()
  const isMember = classGroups.some(g => g.myRole != null)
  const [mounted, setMounted] = React.useState(false)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [filterType, setFilterType] = React.useState<EventType | "all">("all")
  const [duplicateWarning, setDuplicateWarning] = React.useState("")

  // Form State
  const [title, setTitle] = React.useState("")
  const [subjectId, setSubjectId] = React.useState("")
  const [date, setDate] = React.useState(format(new Date(), "yyyy-MM-dd"))
  const [type, setType] = React.useState<EventType>("assignment")
  const [scope, setScope] = React.useState<"INDIVIDUAL" | "CLASS">("INDIVIDUAL")
  const [gradeLabel, setGradeLabel] = React.useState("")

  React.useEffect(() => {
    setMounted(true)
    fetchEvents()
    fetchSubjects()
    fetchClassGroups()
  }, [fetchEvents, fetchSubjects, fetchClassGroups])

  if (!mounted) return null

  const openAddModal = () => {
    setTitle(""); setSubjectId(""); setDate(format(new Date(), "yyyy-MM-dd")); setType("assignment"); setScope("INDIVIDUAL"); setGradeLabel("")
    setDuplicateWarning("")
    setIsModalOpen(true)
  }

  const handleDateChange = (newDate: string) => {
    setDate(newDate)
    setDuplicateWarning("")
    // Check for existing events on same day with same type (exam duplicate check)
    if (type === "exam" && newDate) {
      const existing = events.find(ev =>
        ev.type === "exam" && format(parseISO(ev.date), "yyyy-MM-dd") === newDate
      )
      if (existing) {
        setDuplicateWarning(`Já existe uma prova agendada neste dia: "${existing.title}"`)
      }
    }
  }

  const handleTypeChange = (newType: EventType) => {
    setType(newType)
    setDuplicateWarning("")
    if (newType === "exam" && date) {
      const existing = events.find(ev =>
        ev.type === "exam" && format(parseISO(ev.date), "yyyy-MM-dd") === date
      )
      if (existing) {
        setDuplicateWarning(`Já existe uma prova agendada neste dia: "${existing.title}"`)
      }
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !date) return

    // Check for any duplicate event with same title on same day
    const sameDay = events.filter(ev =>
      format(parseISO(ev.date), "yyyy-MM-dd") === date
    )
    const exactDuplicate = sameDay.find(ev =>
      ev.title.toLowerCase() === title.toLowerCase() && ev.type === type
    )
    if (exactDuplicate) {
      setDuplicateWarning(`Evento idêntico já existe neste dia.`)
      return
    }

    addEvent({
      title,
      subjectId: subjectId && subjectId !== "none" ? subjectId : undefined,
      date: new Date(date + "T12:00:00").toISOString(),
      type,
      scope,
      gradeLabel: gradeLabel || undefined,
    })
    setIsModalOpen(false)
    setDuplicateWarning("")
  }

  // Filter logic
  const filteredEvents = events.filter(ev => {
    const matchesSearch = !searchQuery || ev.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "all" || ev.type === filterType
    return matchesSearch && matchesType
  })

  const sortedEvents = [...filteredEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const eventsByDate = sortedEvents.reduce((acc, event) => {
    const d = format(parseISO(event.date), "yyyy-MM-dd")
    if (!acc[d]) acc[d] = []
    acc[d].push(event)
    return acc
  }, {} as Record<string, Event[]>)

  const hasFilters = searchQuery || filterType !== "all"

  const formatDateLabel = (dateStr: string) => {
    const d = parseISO(dateStr)
    if (isToday(d)) return { primary: "Hoje", secondary: format(d, "d MMM") }
    if (isTomorrow(d)) return { primary: "Amanhã", secondary: format(d, "d MMM") }
    return { primary: format(d, "EEEE"), secondary: format(d, "d MMM") }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="p-5 sm:p-8 space-y-6 max-w-4xl mx-auto"
    >
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground mt-1">Acompanhe tarefas, provas e aulas.</p>
        </div>
        <Button onClick={openAddModal} className="shrink-0 gap-2 shadow-lg">
          <Plus className="w-4 h-4" /> Novo Evento
        </Button>
      </header>

      {/* Search + Filter bar */}
      <div className="flex gap-2 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar evento..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <Select value={filterType} onValueChange={(v) => setFilterType(v as EventType | "all")}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="assignment">Tarefa</SelectItem>
              <SelectItem value="exam">Prova</SelectItem>
              <SelectItem value="class">Aula</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-6">
          {Array(2).fill(0).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="skeleton h-5 w-32 rounded" />
              {Array(2).fill(0).map((_, j) => <SkeletonCard key={j} />)}
            </div>
          ))}
        </div>
      ) : Object.keys(eventsByDate).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mb-4">
            <CalendarCheck className="w-9 h-9 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-bold mb-2">
            {hasFilters ? "Nenhum resultado" : "Agenda livre!"}
          </h3>
          <p className="text-muted-foreground text-sm mb-5 max-w-sm">
            {hasFilters
              ? "Nenhum evento encontrado com esses filtros."
              : "Você não tem eventos agendados. Aproveite ou adicione algo novo."}
          </p>
          {hasFilters ? (
            <Button variant="outline" size="sm" onClick={() => { setSearchQuery(""); setFilterType("all") }} className="gap-1.5">
              <X className="w-3.5 h-3.5" /> Limpar filtros
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={openAddModal} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Adicionar evento
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(eventsByDate).map(([dateStr, dayEvents]) => {
            const { primary, secondary } = formatDateLabel(dateStr)
            const isCurrentDay = isToday(parseISO(dateStr))
            return (
              <section key={dateStr} className="space-y-3">
                {/* Date header */}
                <div className="flex items-center gap-3">
                  <div className={`border-l-2 pl-3 ${isCurrentDay ? "border-primary" : "border-border"}`}>
                    <span className={`text-base font-bold ${isCurrentDay ? "text-primary" : "text-foreground"}`}>
                      {primary}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">{secondary}</span>
                  </div>
                  <div className="h-px bg-border flex-1" />
                  <span className="text-xs text-muted-foreground shrink-0">{dayEvents.length} evento{dayEvents.length !== 1 ? "s" : ""}</span>
                </div>

                {/* Events */}
                <motion.ul className="space-y-2" initial="hidden" animate="show"
                  variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                >
                  <AnimatePresence>
                    {dayEvents.map(event => {
                      const subject = subjects.find(s => s.id === event.subjectId)
                      const typeConfig = EVENT_TYPE_CONFIG[event.type] ?? EVENT_TYPE_CONFIG.other
                      return (
                        <motion.li key={event.id} variants={itemVariants} exit={itemVariants.exit} layout>
                          <motion.div
                            whileHover={{ x: 2 }}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                              event.completed
                                ? "opacity-50 bg-muted/30 border-border/30"
                                : "glass-card hover:border-primary/40"
                            }`}
                          >
                            <button
                              onClick={() => toggleEventCompletion(event.id)}
                              className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                            >
                              {event.completed
                                ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                : <Circle className="w-5 h-5" />}
                            </button>

                            <div className={`flex-1 min-w-0 ${event.completed ? "line-through text-muted-foreground" : ""}`}>
                              <h4 className="font-medium text-sm truncate">{event.title}</h4>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${typeConfig.classes}`}>
                                  {typeConfig.label}
                                </span>
                                {subject && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] py-0 leading-tight"
                                    style={{ borderColor: subject.color, color: subject.color }}
                                  >
                                    {subject.name}
                                  </Badge>
                                )}
                                {event.gradeLabel && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium">
                                    {event.gradeLabel}
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => deleteEvent(event.id)}
                              className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </motion.div>
                        </motion.li>
                      )
                    })}
                  </AnimatePresence>
                </motion.ul>
              </section>
            )
          })}
        </div>
      )}

      {/* Add Event Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Novo Evento"
        description="Agende uma tarefa, prova ou aula."
      >
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Título <span className="text-destructive">*</span></label>
            <Input required placeholder="ex: Ler Capítulo 4" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={type} onValueChange={(v) => handleTypeChange(v as EventType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assignment">Tarefa</SelectItem>
                  <SelectItem value="exam">Prova</SelectItem>
                  <SelectItem value="class">Aula</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data <span className="text-destructive">*</span></label>
              <DatePicker value={date} onChange={handleDateChange} />
            </div>
          </div>

          {/* Duplicate warning */}
          <AnimatePresence>
            {duplicateWarning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 p-3 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {duplicateWarning}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <label className="text-sm font-medium">Matéria (opcional)</label>
            <Select value={subjectId || "none"} onValueChange={(v) => setSubjectId(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="-- Sem matéria --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Sem matéria --</SelectItem>
                {subjects.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Grade label selector: shown when a subject is selected */}
          {subjectId && subjectId !== "none" && (() => {
            const sel = subjects.find(s => s.id === subjectId)
            const configs = sel?.enrollments?.[0]?.gradeConfigs ?? []
            if (configs.length === 0) return null
            return (
              <div className="space-y-2">
                <label className="text-sm font-medium">Vincular à nota (opcional)</label>
                <Select value={gradeLabel || "none"} onValueChange={v => setGradeLabel(v === "none" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="-- Nenhuma --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Nenhuma --</SelectItem>
                    {configs.map((gc: { label: string }) => (
                      <SelectItem key={gc.label} value={gc.label}>{gc.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {gradeLabel && (
                  <p className="text-xs text-muted-foreground">
                    Apenas um evento pode ser vinculado a {gradeLabel} nesta matéria.
                  </p>
                )}
              </div>
            )
          })()}

          {/* Scope selector: for any event when user belongs to a class */}
          {isMember && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Visibilidade</label>
              <Select value={scope} onValueChange={(v) => setScope(v as "INDIVIDUAL" | "CLASS")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INDIVIDUAL">Somente eu</SelectItem>
                  <SelectItem value="CLASS">Turma (visível para todos)</SelectItem>
                </SelectContent>
              </Select>
              {scope === "CLASS" && (
                <p className="text-xs text-muted-foreground">
                  A data da prova ficará visível para todos da turma.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Adicionar</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  )
}
