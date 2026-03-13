"use client"

import { useEffect, useState } from "react"
import { Building2, Plus, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { fetchApi } from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import { useRouter } from "next/navigation"

interface Institution {
  id: string
  name: string
}

export default function AdminInstitutionsPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [newName, setNewName] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!user || user.role !== "ADMIN") { router.push("/"); return }
    fetchApi("/institutions")
      .then(setInstitutions)
      .catch(() => setError("Erro ao carregar instituições."))
      .finally(() => setLoading(false))
  }, [user, router])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    setError("")
    try {
      const created = await fetchApi("/admin/institutions", {
        method: "POST",
        body: JSON.stringify({ name: newName.trim() }),
      })
      setInstitutions(prev => [...prev, created])
      setNewName("")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar instituição.")
    } finally {
      setSaving(false)
    }
  }

  if (!user || user.role !== "ADMIN") return null

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Instituições</h1>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          required
          placeholder="Nome da instituição..."
          value={newName}
          onChange={e => setNewName(e.target.value)}
          className="bg-background/50"
        />
        <Button type="submit" disabled={saving} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          {saving ? "Adicionando..." : "Adicionar"}
        </Button>
      </form>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-10 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {institutions.map(inst => (
            <div key={inst.id} className="flex items-center gap-3 bg-card rounded-xl p-3 border">
              <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm">{inst.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
