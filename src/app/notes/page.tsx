"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useStore } from "@/store/useStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { SkeletonCard } from "@/components/ui/skeleton"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Plus, StickyNote, Trash2, Edit2, Search, X, Filter } from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

const cardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 280, damping: 24 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
}

export default function NotesPage() {
  const { notes, subjects, loading, addNote, updateNote, deleteNote, fetchNotes, fetchSubjects } = useStore()
  const [mounted, setMounted] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [filterSubject, setFilterSubject] = React.useState("")
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)

  // Form state
  const [title, setTitle] = React.useState("")
  const [content, setContent] = React.useState("")
  const [subjectId, setSubjectId] = React.useState("")

  React.useEffect(() => {
    setMounted(true)
    fetchNotes()
    fetchSubjects()
  }, [fetchNotes, fetchSubjects])

  if (!mounted) return null

  const resetForm = () => { setTitle(""); setContent(""); setSubjectId(""); setEditingId(null) }

  const openAddModal = () => { resetForm(); setIsModalOpen(true) }

  const openEditModal = (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return
    setTitle(note.title)
    setContent(note.content)
    setSubjectId(note.subjectId)
    setEditingId(noteId)
    setIsModalOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !subjectId) return
    if (editingId) {
      updateNote(editingId, { title, content, subjectId })
    } else {
      addNote({ title, content, subjectId })
    }
    setIsModalOpen(false)
    resetForm()
  }

  const filteredNotes = notes
    .filter(n => !filterSubject || n.subjectId === filterSubject)
    .filter(n =>
      !searchQuery ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  const hasFilters = searchQuery || filterSubject

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="p-5 sm:p-8 space-y-6 max-w-5xl mx-auto"
    >
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Notas</h1>
          <p className="text-muted-foreground mt-1">Registre resumos e lembretes das aulas.</p>
        </div>
        <Button onClick={openAddModal} className="shrink-0 gap-2 shadow-lg" disabled={subjects.length === 0}>
          <Plus className="w-4 h-4" /> Nova Nota
        </Button>
      </header>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar notas..."
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
          <Select value={filterSubject || "all"} onValueChange={v => setFilterSubject(v === "all" ? "" : v)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Todas as matérias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as matérias</SelectItem>
              {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mb-4">
            <StickyNote className="w-9 h-9 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-bold mb-2">Nenhuma nota ainda</h3>
          <p className="text-muted-foreground text-sm mb-5 max-w-sm">
            Crie sua primeira nota para registrar resumos ou ideias de aulas.
          </p>
          {subjects.length === 0 ? (
            <p className="text-sm text-destructive">Adicione uma matéria antes de criar notas.</p>
          ) : (
            <Button onClick={openAddModal} variant="outline" size="sm" className="gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Criar Nota
            </Button>
          )}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-4">Nenhuma nota encontrada com esses filtros.</p>
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={() => { setSearchQuery(""); setFilterSubject("") }} className="gap-1.5">
              <X className="w-3.5 h-3.5" /> Limpar filtros
            </Button>
          )}
        </div>
      ) : (
        <motion.div
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          initial="hidden"
          animate="show"
        >
          <AnimatePresence>
            {filteredNotes.map(note => {
              const subject = subjects.find(s => s.id === note.subjectId)
              return (
                <motion.div
                  key={note.id}
                  variants={cardVariants}
                  exit={cardVariants.exit}
                  layout
                  whileHover={{ y: -3 }}
                  className="glass-card-elevated rounded-2xl flex flex-col group overflow-hidden"
                  style={{ borderTop: `4px solid ${subject?.color ?? "#6366f1"}` }}
                >
                  {/* Action buttons on hover */}
                  <div className="relative">
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                      <button
                        onClick={() => openEditModal(note.id)}
                        className="p-1.5 bg-card/90 backdrop-blur-sm text-muted-foreground hover:text-primary rounded-lg shadow-sm transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="p-1.5 bg-card/90 backdrop-blur-sm text-muted-foreground hover:text-destructive rounded-lg shadow-sm transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Note content */}
                  <div className="p-5 flex-1 flex flex-col overflow-hidden min-h-[180px] max-h-[260px]">
                    {subject && (
                      <Badge
                        variant="outline"
                        className="mb-2 text-[10px] self-start"
                        style={{ borderColor: subject.color, color: subject.color }}
                      >
                        {subject.name}
                      </Badge>
                    )}
                    <h3 className="font-bold text-base leading-tight line-clamp-2 mb-2">{note.title}</h3>
                    <div className="flex-1 overflow-hidden relative">
                      <p className="text-muted-foreground text-sm whitespace-pre-wrap leading-relaxed line-clamp-5">
                        {note.content}
                      </p>
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card/80 to-transparent pointer-events-none" />
                    </div>
                  </div>

                  {/* Footer with timestamp */}
                  <div className="px-5 py-2.5 border-t border-border/40 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      {note.updatedAt
                        ? format(parseISO(note.updatedAt), "d MMM yyyy", { locale: ptBR })
                        : ""}
                    </span>
                    <button
                      onClick={() => openEditModal(note.id)}
                      className="text-[10px] text-muted-foreground hover:text-primary transition-colors font-medium"
                    >
                      Editar →
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Editar Nota" : "Nova Nota"}
      >
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Matéria <span className="text-destructive">*</span></label>
            <Select value={subjectId} onValueChange={setSubjectId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma matéria" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Título <span className="text-destructive">*</span></label>
            <Input required placeholder="ex: Resumo do Capítulo 1" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Conteúdo</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Escreva suas notas aqui..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit">{editingId ? "Salvar" : "Criar Nota"}</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  )
}
