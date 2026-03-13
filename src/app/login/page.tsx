"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { AlertCircle, LogIn, AtSign } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { fetchApi } from "@/lib/api"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const setAuth = useAuthStore(state => state.setAuth)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const data = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: username.toLowerCase(), password }),
      })
      setAuth(data.token, data.user)
      router.push("/")
    } catch (err: any) {
      setError(err.message || "Credenciais inválidas. Verifique e tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card rounded-2xl p-8 shadow-2xl border-primary/20">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 rounded-2xl overflow-hidden mb-4 shadow-lg ring-2 ring-primary/30">
              <Image
                src="/unnamed.png"
                alt="Guis"
                width={80}
                height={80}
                className="object-cover w-full h-full"
                priority
              />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Bem-vindo!</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">Entre na sua conta do Guis Planner</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Error message */}
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
              <label className="text-sm font-medium">Usuário</label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  required
                  placeholder="nome.sobrenome"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="bg-background/50 pl-9 lowercase"
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">Formato: nome.sobrenome</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Senha</label>
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-background/50"
              />
            </div>

            <Button
              type="submit"
              className="w-full gap-2 shadow-lg"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Entrar
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground pt-3 border-t border-border/50">
              Não tem conta?{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Cadastre-se
              </Link>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
