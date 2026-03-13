"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Users, Plus, Crown, LogIn, ChevronRight, AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { useClassGroupStore, ClassGroup } from "@/store/classGroupStore"
import { useAuthStore } from "@/store/authStore"
import Link from "next/link"
import { Search } from "lucide-react"

const COURSES = [
  "Administração", "Agronomia", "Análise e Desenvolvimento de Sistemas", "Arquitetura e Urbanismo",
  "Artes Visuais", "Biomedicina", "Ciência da Computação", "Ciências Biológicas", "Ciências Contábeis",
  "Ciências Econômicas", "Comunicação Social", "Design", "Direito", "Educação Física", "Enfermagem",
  "Engenharia Aeronáutica", "Engenharia Ambiental", "Engenharia Biomédica", "Engenharia Civil",
  "Engenharia de Alimentos", "Engenharia de Computação", "Engenharia de Controle e Automação",
  "Engenharia de Materiais", "Engenharia de Minas", "Engenharia de Pesca", "Engenharia de Petróleo",
  "Engenharia de Produção", "Engenharia de Software", "Engenharia de Telecomunicações",
  "Engenharia Elétrica", "Engenharia Eletrônica", "Engenharia Física", "Engenharia Florestal",
  "Engenharia Mecânica", "Engenharia Mecatrônica", "Engenharia Metalúrgica", "Engenharia Naval",
  "Engenharia Nuclear", "Engenharia Química", "Estética e Cosmética", "Farmácia", "Filosofia",
  "Fisioterapia", "Fonoaudiologia", "Gastronomia", "Gestão de Recursos Humanos", "Gestão Financeira",
  "Gestão Pública", "História", "Jornalismo", "Letras", "Logística", "Marketing", "Matemática",
  "Medicina", "Medicina Veterinária", "Moda", "Nutrição", "Odontologia", "Pedagogia",
  "Processos Gerenciais", "Psicologia", "Publicidade e Propaganda", "Radiologia",
  "Relações Internacionais", "Serviço Social", "Sistemas de Informação", "Teologia", "Turismo"
].sort()

const SEMESTERS = (() => {
  const list = []
  for (let y = 2022; y <= 2099; y++) {
    list.push(`${y}.1`)
    list.push(`${y}.2`)
  }
  return list
})()

function RequestModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [course, setCourse] = useState("")
  const [courseSearch, setCourseSearch] = useState("")
  const [semester, setSemester] = useState("")
  const [turn, setTurn] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showCourseList, setShowCourseList] = useState(false)
  const listRef = React.useRef<HTMLUListElement>(null)
  
  const { user } = useAuthStore()
  const { createClassGroup } = useClassGroupStore()

  // Handle click outside to close course list
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(event.target as Node)) {
        setShowCourseList(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredCourses = COURSES.filter(c => 
    c.toLowerCase().includes(courseSearch.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!course || !semester || !turn) {
      setError("Por favor, preencha todos os campos.")
      return
    }

    if (!user?.institutionId) {
      setError("Sua conta não tem instituição associada.")
      return
    }

    const name = `${course} - ${semester} - ${turn}`
    
    setLoading(true)
    try {
      await createClassGroup(name, user.institutionId)
      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar turma.")
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
          <h2 className="text-lg font-bold">Criar Nova Turma</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted/50 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Curso Searchable */}
          <div className="space-y-1.5 relative">
            <label className="text-sm font-medium">Curso</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar curso..."
                value={course ? course : courseSearch}
                onChange={e => {
                  setCourseSearch(e.target.value)
                  setCourse("")
                  setShowCourseList(true)
                }}
                onFocus={() => setShowCourseList(true)}
                className="bg-background/50 pl-9"
              />
            </div>
            
            <AnimatePresence>
              {showCourseList && (
                <motion.ul
                  ref={listRef}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-[60] w-full mt-1 max-h-48 overflow-y-auto bg-popover border rounded-xl shadow-xl p-1 no-scrollbar"
                >
                  {filteredCourses.length > 0 ? (
                    filteredCourses.map(c => (
                      <li
                        key={c}
                        onClick={() => {
                          setCourse(c)
                          setCourseSearch("")
                          setShowCourseList(false)
                        }}
                        className="px-3 py-2 text-sm hover:bg-accent rounded-lg cursor-pointer transition-colors"
                      >
                        {c}
                      </li>
                    ))
                  ) : (
                    <li className="px-3 py-2 text-sm text-muted-foreground">Nenhum curso encontrado</li>
                  )}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Semestre */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Semestre</label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <div className="max-h-48 overflow-y-auto">
                    {SEMESTERS.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            </div>

            {/* Turno */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Turno</label>
              <Select value={turn} onValueChange={setTurn}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Diurno">Diurno</SelectItem>
                  <SelectItem value="Noturno">Noturno</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Enviando..." : "Solicitar"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

function ClassGroupCard({ group, onJoin }: { group: ClassGroup; onJoin: (id: string) => Promise<void> }) {
  const [joining, setJoining] = useState(false)
  const handleJoin = async () => {
    setJoining(true)
    try {
      await onJoin(group.id)
    } catch {
      // error handled upstream
    } finally {
      setJoining(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-4 border shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{group.name}</p>
          {group.leader && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Crown className="w-3 h-3 text-amber-500" />
              {group.leader.name}
            </p>
          )}
          {group.memberCount != null && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {group.memberCount} {group.memberCount === 1 ? "membro" : "membros"}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {group.myRole != null ? (
            <Link href={`/turmas/${group.id}`}>
              <Button size="sm" variant="outline" className="gap-1">
                Acessar <ChevronRight className="w-3 h-3" />
              </Button>
            </Link>
          ) : (
            <Button size="sm" onClick={handleJoin} disabled={joining} className="gap-1">
              <LogIn className="w-3 h-3" />
              {joining ? "Entrando..." : "Entrar"}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function TurmasPage() {
  const [showRequest, setShowRequest] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const { classGroups, loading, error, fetchClassGroups, joinClassGroup } = useClassGroupStore()

  useEffect(() => {
    fetchClassGroups()
  }, [fetchClassGroups])

  const handleJoin = async (id: string) => {
    await joinClassGroup(id)
    fetchClassGroups()
  }

  const handleRequestSuccess = () => {
    setSuccessMsg("Turma criada com sucesso!")
    fetchClassGroups()
    setTimeout(() => setSuccessMsg(""), 5000)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Turmas</h1>
          <p className="text-sm text-muted-foreground mt-1">Encontre e entre em turmas da sua instituição</p>
        </div>
        <Button onClick={() => setShowRequest(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Criar Turma
        </Button>
      </div>

      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-xl px-4 py-3 text-sm"
          >
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card rounded-2xl p-4 border animate-pulse h-20" />
          ))}
        </div>
      ) : classGroups.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhuma turma encontrada</p>
          <p className="text-sm mt-1">Seja o primeiro a criar uma turma na sua instituição!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {classGroups.map(group => (
            <ClassGroupCard key={group.id} group={group} onJoin={handleJoin} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showRequest && (
          <RequestModal
            onClose={() => setShowRequest(false)}
            onSuccess={handleRequestSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
