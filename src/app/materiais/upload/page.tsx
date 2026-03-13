"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { fetchApi } from "@/lib/api"
import { useAuthStore } from "@/store/authStore"

interface Institution {
  id: string
  name: string
}

export default function UploadMaterialPage() {
  const router = useRouter()
  const { user, isPremium } = useAuthStore()
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [form, setForm] = useState({
    institutionId: "",
    course: "",
    subjectName: "",
    professor: "",
    semester: "",
    type: "",
    fileUrl: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isPremium()) { router.push("/materiais"); return }
    fetchApi("/institutions").then(setInstitutions).catch(() => {})
    if (user?.institutionId) {
      setForm(prev => ({ ...prev, institutionId: user.institutionId! }))
    }
  }, [isPremium, router, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!form.fileUrl.trim()) { setError("Insira a URL do arquivo."); return }
    setLoading(true)
    try {
      await fetchApi("/materials", {
        method: "POST",
        body: JSON.stringify({ ...form }),
      })
      router.push("/materiais")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao enviar material.")
    } finally {
      setLoading(false)
    }
  }

  const set = (key: keyof typeof form) => (val: string) => setForm(prev => ({ ...prev, [key]: val }))

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Enviar Material</h1>
        <p className="text-sm text-muted-foreground mt-1">Compartilhe provas, listas ou resumos com sua instituição</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Instituição</label>
          <Select value={form.institutionId} onValueChange={set("institutionId")}>
            <SelectTrigger className="bg-background/50">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {institutions.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Curso</label>
            <Input required placeholder="ADS" value={form.course} onChange={e => set("course")(e.target.value)} className="bg-background/50" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Semestre</label>
            <Input required placeholder="2024.1" value={form.semester} onChange={e => set("semester")(e.target.value)} className="bg-background/50" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Matéria</label>
            <Input required placeholder="Cálculo I" value={form.subjectName} onChange={e => set("subjectName")(e.target.value)} className="bg-background/50" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Professor</label>
            <Input required placeholder="Dr. Silva" value={form.professor} onChange={e => set("professor")(e.target.value)} className="bg-background/50" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Tipo</label>
          <Select value={form.type} onValueChange={set("type")}>
            <SelectTrigger className="bg-background/50">
              <SelectValue placeholder="Selecione o tipo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EXAM">Prova</SelectItem>
              <SelectItem value="EXERCISE_LIST">Lista de Exercícios</SelectItem>
              <SelectItem value="SUMMARY">Resumo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">URL do arquivo</label>
          <Input
            required
            type="url"
            placeholder="https://..."
            value={form.fileUrl}
            onChange={e => set("fileUrl")(e.target.value)}
            className="bg-background/50"
          />
          <p className="text-xs text-muted-foreground">
            Faça upload do arquivo para um serviço de armazenamento (Google Drive, Dropbox, etc.) e cole o link aqui.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1 gap-2" disabled={loading}>
            <Upload className="w-4 h-4" />
            {loading ? "Enviando..." : "Enviar para validação"}
          </Button>
        </div>
      </form>
    </div>
  )
}
