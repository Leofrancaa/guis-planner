"use client"

import { motion } from "framer-motion"
import { Github, Bug, GitPullRequest, Crown, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const GITHUB_URL = "https://github.com/Leofrancaa/guis-planner"

const steps = [
  {
    icon: Bug,
    title: "Reporte um bug",
    desc: "Encontrou algo quebrado? Abra uma issue descrevendo o problema, como reproduzir e qual era o comportamento esperado.",
  },
  {
    icon: GitPullRequest,
    title: "Envie um Pull Request",
    desc: "Implementou uma melhoria ou corrigiu um bug? Abra um PR com uma descrição clara das mudanças.",
  },
  {
    icon: Crown,
    title: "Ganhe 1 mês Premium",
    desc: "Contribuições aceitas (issues válidas ou PRs merged) são recompensadas com 1 mês de plano Premium, concedido manualmente pela equipe.",
  },
]

export default function ContribuirPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="p-6 max-w-2xl mx-auto space-y-8"
    >
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
          <Github className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Contribuir com o Projeto</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          O Guis Planner é um projeto open source. Toda contribuição é bem-vinda — e recompensada!
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-4 bg-card rounded-2xl p-5 border shadow-sm"
          >
            <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
              <step.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{step.title}</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 space-y-2">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-500" />
          <p className="font-semibold text-sm text-amber-600 dark:text-amber-400">Como funciona o prêmio</p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Após a equipe avaliar e aceitar sua contribuição — seja uma issue válida descrevendo um bug real ou um PR mergeado — um dos admins irá conceder 1 mês de plano Premium à sua conta. Não há automação: é uma forma da equipe agradecer o esforço de quem nos ajuda a melhorar a plataforma.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
          <Button className="gap-2 w-full sm:w-auto">
            <Github className="w-4 h-4" />
            Ver no GitHub
            <ExternalLink className="w-3 h-3" />
          </Button>
        </a>
        <Link href="/">
          <Button variant="outline" className="w-full sm:w-auto">Voltar ao Dashboard</Button>
        </Link>
      </div>
    </motion.div>
  )
}
