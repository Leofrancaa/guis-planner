"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { AlertCircle, UserPlus, AtSign } from "lucide-react"
import { fetchApi } from "@/lib/api"
import { useAuthStore } from "@/store/authStore"

interface ClassGroup {
  id: string
  name: string
}

// "João da Silva" → "joao.silva"
function suggestUsername(fullName: string): string {
  const normalized = fullName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim()
  const words = normalized.split(/\s+/).filter(Boolean)
  if (words.length === 0) return ""
  if (words.length === 1) return words[0]
  return `${words[0]}.${words[words.length - 1]}`
}

function isValidUsername(username: string): boolean {
  return /^[a-z][a-z0-9]*\.[a-z][a-z0-9]*$/.test(username)
}

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [usernameEdited, setUsernameEdited] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [classGroupId, setClassGroupId] = useState("")
  const [classes, setClasses] = useState<ClassGroup[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const setAuth = useAuthStore(state => state.setAuth)

  useEffect(() => {
    fetchApi("/auth/classes").then(setClasses).catch(() => {})
  }, [])

  // Auto-suggest username from full name unless manually edited
  useEffect(() => {
    if (!usernameEdited) {
      setUsername(suggestUsername(name))
    }
  }, [name, usernameEdited])

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsernameEdited(true)
    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9.]/g, ""))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!isValidUsername(username)) {
      setError("Usuário inválido. Use o formato nome.sobrenome (letras minúsculas e um ponto).")
      return
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.")
      return
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.")
      return
    }

    setLoading(true)
    try {
      const resolvedClassGroupId = classGroupId && classGroupId !== "none" ? classGroupId : undefined
      const data = await fetchApi("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, username, password, classGroupId: resolvedClassGroupId }),
      })
      setAuth(data.token, data.user)
      router.push("/")
    } catch (err: any) {
      setError(err.message || "Falha ao criar conta. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const usernameValid = username ? isValidUsername(username) : null

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/20 via-background to-background pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card rounded-2xl p-8 shadow-2xl border-accent/20">
          <div className="text-center mb-8">
            <div className="mx-auto w-14 h-14 bg-gradient-to-br from-accent to-primary rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg font-black text-xl tracking-tight">
              GP
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Criar Conta</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">Junte-se ao Guis Planner e organize seus estudos</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nome completo</label>
              <Input
                required
                placeholder="João da Silva"
                value={name}
                onChange={e => setName(e.target.value)}
                className="bg-background/50"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Usuário
                <span className="text-muted-foreground font-normal text-xs ml-1">(nome.sobrenome)</span>
              </label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  required
                  placeholder="joao.silva"
                  value={username}
                  onChange={handleUsernameChange}
                  className={`bg-background/50 pl-9 ${
                    username && !usernameValid ? "border-destructive focus-visible:ring-destructive" : ""
                  }`}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
              {username && !usernameValid && (
                <p className="text-[11px] text-destructive">Use apenas letras e um ponto: nome.sobrenome</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Senha</label>
                <Input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirmar</label>
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={`bg-background/50 ${confirmPassword && confirmPassword !== password ? "border-destructive" : ""}`}
                />
              </div>
            </div>

            {classes.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Turma <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
                </label>
                <Select value={classGroupId} onValueChange={setClassGroupId}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Selecione sua turma..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem turma</SelectItem>
                    {classes.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {classGroupId && classGroupId !== "none" && (
                  <p className="text-xs text-muted-foreground">
                    Provas e matérias da turma serão visíveis para todos os membros.
                  </p>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full gap-2 shadow-lg bg-gradient-to-r from-accent to-primary hover:opacity-90"
              disabled={loading || (!!username && !usernameValid)}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Criando conta...
                </span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Criar Conta
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground pt-3 border-t border-border/50">
              Já tem conta?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Entrar
              </Link>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
