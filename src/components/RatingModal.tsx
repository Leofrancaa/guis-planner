"use client"

import * as React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { X, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchApi } from "@/lib/api"
import { useToastStore } from "@/store/toastStore"

interface RatingCriterion {
  key: string
  label: string
  max: number
  description: string
}

const CRITERIA: RatingCriterion[] = [
  { key: "didatica",        label: "Didática",        max: 5, description: "Como o professor explica o conteúdo" },
  { key: "clareza",         label: "Clareza",          max: 5, description: "Clareza na comunicação" },
  { key: "disponibilidade", label: "Disponibilidade",  max: 5, description: "Acessibilidade fora de sala" },
  { key: "pontualidade",    label: "Pontualidade",     max: 5, description: "Cumprimento de horários" },
  { key: "dificuldade",     label: "Dificuldade",      max: 5, description: "Nível de dificuldade da matéria" },
]

function StarSelector({ value, max, onChange }: { value: number; max: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-6 h-6 transition-colors ${
              n <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  )
}

interface RatingModalProps {
  subjectId: string
  subjectName: string
  professor: string
  existing?: { didatica: number; clareza: number; disponibilidade: number; pontualidade: number; dificuldade: number } | null
  onClose: () => void
  onSuccess: () => void
}

export function RatingModal({ subjectId, subjectName, professor, existing, onClose, onSuccess }: RatingModalProps) {
  const addToast = useToastStore(state => state.addToast)
  const [loading, setLoading] = useState(false)
  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    for (const c of CRITERIA) init[c.key] = existing ? (existing as Record<string, number>)[c.key] ?? 0 : 0
    return init
  })

  const allFilled = CRITERIA.every(c => values[c.key] > 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allFilled) return
    setLoading(true)
    try {
      await fetchApi("/ratings", {
        method: "POST",
        body: JSON.stringify({ subjectId, professor, ...values }),
      })
      addToast("Avaliação enviada!", "success")
      onSuccess()
      onClose()
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Erro ao enviar avaliação.", "error")
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
        className="bg-card rounded-2xl p-6 w-full max-w-md shadow-2xl border max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold">Avaliar Professor</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted/50">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          {subjectName} · <span className="font-medium text-foreground">{professor}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {CRITERIA.map(c => (
            <div key={c.key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{c.label}</label>
                <span className="text-xs text-muted-foreground">{values[c.key] || "—"}/{c.max}</span>
              </div>
              <p className="text-xs text-muted-foreground">{c.description}</p>
              <StarSelector
                value={values[c.key]}
                max={c.max}
                onChange={v => setValues(prev => ({ ...prev, [c.key]: v }))}
              />
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading || !allFilled}>
              {loading ? "Enviando..." : existing ? "Atualizar" : "Avaliar"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
