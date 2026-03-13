"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { FileText, Upload, Search, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { PremiumGate } from "@/components/ui/premium-gate"
import { fetchApi } from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import Link from "next/link"

interface Material {
  id: string
  subjectName: string
  professor: string
  course: string
  semester: string
  type: "EXAM" | "EXERCISE_LIST" | "SUMMARY"
  fileUrl: string
  createdAt: string
}

const TYPE_LABELS: Record<string, string> = {
  EXAM: "Prova",
  EXERCISE_LIST: "Lista de Exercícios",
  SUMMARY: "Resumo",
}

const TYPE_COLORS: Record<string, string> = {
  EXAM: "bg-red-500/10 text-red-500",
  EXERCISE_LIST: "bg-blue-500/10 text-blue-500",
  SUMMARY: "bg-emerald-500/10 text-emerald-500",
}

function MaterialsContent() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [error, setError] = useState("")

  useEffect(() => {
    fetchApi("/materials")
      .then(data => setMaterials(Array.isArray(data) ? data : data.materials ?? []))
      .catch(() => setError("Erro ao carregar materiais."))
      .finally(() => setLoading(false))
  }, [])

  const filtered = materials.filter(m => {
    const matchSearch = search === "" ||
      m.subjectName.toLowerCase().includes(search.toLowerCase()) ||
      m.professor.toLowerCase().includes(search.toLowerCase()) ||
      m.course.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === "ALL" || m.type === typeFilter
    return matchSearch && matchType
  })

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar matéria, professor ou curso..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-background/50"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[110px] sm:w-[160px] bg-background/50 shrink-0">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="EXAM">Provas</SelectItem>
            <SelectItem value="EXERCISE_LIST">Listas</SelectItem>
            <SelectItem value="SUMMARY">Resumos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Nenhum material encontrado.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map(mat => (
            <motion.a
              key={mat.id}
              href={mat.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl p-4 border shadow-sm hover:shadow-md transition-shadow flex items-start gap-3"
            >
              <div className="p-2 rounded-xl bg-muted shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <p className="font-semibold text-sm truncate flex-1">{mat.subjectName}</p>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${TYPE_COLORS[mat.type]}`}>
                    {TYPE_LABELS[mat.type]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{mat.professor}</p>
                <p className="text-xs text-muted-foreground">{mat.course} · {mat.semester}</p>
              </div>
            </motion.a>
          ))}
        </div>
      )}
    </div>
  )
}

export default function MateriaisPage() {
  const { isPremium } = useAuthStore()

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Materiais</h1>
          <p className="text-sm text-muted-foreground mt-1">Provas, listas e resumos da sua instituição</p>
        </div>
        {isPremium() && (
          <Link href="/materiais/upload">
            <Button className="gap-2">
              <Upload className="w-4 h-4" /> Enviar Material
            </Button>
          </Link>
        )}
      </div>

      {isPremium() ? (
        <MaterialsContent />
      ) : (
        <PremiumGate>
          <MaterialsContent />
        </PremiumGate>
      )}
    </div>
  )
}
