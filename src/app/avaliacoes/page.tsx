"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Star, Search, X, GraduationCap, ChevronDown, ChevronUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { fetchApi } from "@/lib/api"
import { useToastStore } from "@/store/toastStore"
import { useAuthStore } from "@/store/authStore"
import { PremiumGate } from "@/components/ui/premium-gate"
import { RatingModal } from "@/components/RatingModal"

interface SubjectRating {
  subjectId: string
  subjectName: string
  professor: string
  classGroupName?: string
  totalRatings: number
  avgDidatica: number
  avgClareza: number
  avgDisponibilidade: number
  avgPontualidade: number
  avgDificuldade: number
}

interface RatedSubject {
  id: string
  name: string
  professor: string
  classGroupName?: string
}

const CRITERIA = [
  { key: "avgDidatica",        label: "Didática" },
  { key: "avgClareza",         label: "Clareza" },
  { key: "avgDisponibilidade", label: "Disponibilidade" },
  { key: "avgPontualidade",    label: "Pontualidade" },
  { key: "avgDificuldade",     label: "Dificuldade" },
]

function StarBar({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: max }, (_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${i < Math.round(value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`}
          />
        ))}
      </div>
      <span className="text-xs font-medium">{value.toFixed(1)}</span>
    </div>
  )
}

function RatingCard({ rating, onRate }: { rating: SubjectRating; onRate: (r: SubjectRating) => void }) {
  const [expanded, setExpanded] = React.useState(false)
  const overall = ((rating.avgDidatica + rating.avgClareza + rating.avgDisponibilidade + rating.avgPontualidade) / 4)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border rounded-2xl overflow-hidden"
    >
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{rating.subjectName}</p>
          <p className="text-xs text-muted-foreground truncate">{rating.professor}</p>
          {rating.classGroupName && (
            <p className="text-xs text-muted-foreground/60 truncate">{rating.classGroupName}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-bold text-sm">{overall.toFixed(1)}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">{rating.totalRatings} avaliação{rating.totalRatings !== 1 ? "ões" : ""}</p>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t pt-3">
              <div className="grid grid-cols-1 gap-2">
                {CRITERIA.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${((rating as unknown as Record<string, number>)[key] / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-6 text-right">
                      {((rating as unknown as Record<string, number>)[key] as number).toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={e => { e.stopPropagation(); onRate(rating) }}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Star className="w-3 h-3" /> Avaliar este professor
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function AvaliacoesContent() {
  const addToast = useToastStore(state => state.addToast)
  const { isPremium } = useAuthStore()
  const [ratings, setRatings] = React.useState<SubjectRating[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [ratingTarget, setRatingTarget] = React.useState<RatedSubject | null>(null)

  React.useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await fetchApi("/ratings/institution")
        if (Array.isArray(data)) setRatings(data)
      } catch {
        addToast("Erro ao carregar avaliações.", "error")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [addToast])

  const filtered = ratings.filter(r => {
    if (!search) return true
    const q = search.toLowerCase()
    return r.professor.toLowerCase().includes(q) || r.subjectName.toLowerCase().includes(q)
  })

  const handleRate = (r: SubjectRating) => {
    if (!isPremium()) {
      addToast("A avaliação de professores é exclusiva para usuários Premium.", "error")
      return
    }
    setRatingTarget({ id: r.subjectId, name: r.subjectName, professor: r.professor })
  }

  return (
    <div className="p-5 sm:p-8 space-y-6 max-w-3xl mx-auto">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">Avaliações</h1>
        <p className="text-muted-foreground mt-1">Veja e contribua com avaliações de professores da sua instituição.</p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar por professor ou matéria..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{search ? "Nenhum resultado" : "Nenhuma avaliação ainda"}</p>
          <p className="text-sm mt-1">
            {search ? "Tente outro termo de busca." : "Seja o primeiro a avaliar um professor!"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <RatingCard key={`${r.subjectId}-${r.professor}`} rating={r} onRate={handleRate} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {ratingTarget && (
          <RatingModal
            subjectId={ratingTarget.id}
            subjectName={ratingTarget.name}
            professor={ratingTarget.professor}
            existing={null}
            onClose={() => setRatingTarget(null)}
            onSuccess={async () => {
              setRatingTarget(null)
              const data = await fetchApi("/ratings/institution").catch(() => [])
              if (Array.isArray(data)) setRatings(data)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default function AvaliacoesPage() {
  return (
    <PremiumGate>
      <AvaliacoesContent />
    </PremiumGate>
  )
}
