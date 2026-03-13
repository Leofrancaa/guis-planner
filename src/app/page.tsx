"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { useStore } from "@/store/useStore"
import { useAuthStore } from "@/store/authStore"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SkeletonStat, SkeletonCard } from "@/components/ui/skeleton"
import {
  BookOpen, Calendar, CheckCircle2, Circle, Clock,
  PlusCircle, ArrowRight, StickyNote, Sparkles, TrendingUp
} from "lucide-react"
import { format, isToday, isTomorrow, parseISO } from "date-fns"
import Link from "next/link"
import { useRouter } from "next/navigation"

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 25 } }
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  exam: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  assignment: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  class: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  other: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
}

export default function Dashboard() {
  const { subjects, events, notes, loading, toggleEventCompletion, fetchAll } = useStore()
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [mounted, setMounted] = React.useState(false)
  const [greeting, setGreeting] = React.useState("")

  React.useEffect(() => {
    setMounted(true)
    const hour = new Date().getHours()
    const greet = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite"
    setGreeting(user?.name ? `${greet}, ${user.name.split(" ")[0]}! 👋` : `${greet}!`)
  }, [user?.name])

  React.useEffect(() => {
    if (!mounted) return
    if (!isAuthenticated) {
      router.replace("/login")
      return
    }
    fetchAll()
  }, [mounted, isAuthenticated, fetchAll, router])

  if (!mounted || !isAuthenticated) return null

  const upcomingEvents = events
    .filter(ev => !ev.completed)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)

  const todayEvents = events.filter(ev => ev.date && isToday(parseISO(ev.date)))
  const completedCount = events.filter(e => e.completed).length
  const completionRate = events.length > 0 ? Math.round((completedCount / events.length) * 100) : 0

  const formatEventDate = (date: string) => {
    if (isToday(parseISO(date))) return "Hoje"
    if (isTomorrow(parseISO(date))) return "Amanhã"
    return format(parseISO(date), "d MMM")
  }

  const stats = [
    {
      label: "Matérias",
      value: subjects.length,
      sub: "cursos matriculados",
      icon: BookOpen,
      gradient: "from-primary/20 to-primary/5",
      iconColor: "text-primary bg-primary/10",
    },
    {
      label: "Hoje",
      value: todayEvents.length,
      sub: "eventos agendados",
      icon: Calendar,
      gradient: "from-accent/20 to-accent/5",
      iconColor: "text-accent bg-accent/10",
    },
    {
      label: "Conclusão",
      value: `${completionRate}%`,
      sub: "taxa geral de tarefas",
      icon: TrendingUp,
      gradient: "from-emerald-500/20 to-emerald-500/5",
      iconColor: "text-emerald-500 bg-emerald-500/10",
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="p-5 sm:p-8 max-w-6xl mx-auto space-y-8"
    >
      {/* Header */}
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {greeting}
          </h1>
        </div>
        <p className="text-muted-foreground text-base">
          {upcomingEvents.length === 0
            ? "Sua agenda está livre. Que tal adicionar um evento?"
            : `Você tem ${upcomingEvents.length} tarefa${upcomingEvents.length !== 1 ? "s" : ""} pendente${upcomingEvents.length !== 1 ? "s" : ""}.`}
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading
          ? Array(3).fill(0).map((_, i) => <SkeletonStat key={i} />)
          : stats.map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ y: -2, scale: 1.01 }}
              className={`glass-stat rounded-2xl p-5 bg-gradient-to-br ${stat.gradient} relative overflow-hidden`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                <div className={`p-2 rounded-xl ${stat.iconColor}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-4xl font-extrabold tracking-tighter text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
              {stat.label === "Conclusão" && events.length > 0 && (
                <div className="mt-3 h-1.5 bg-border/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completionRate}%` }}
                    transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
              )}
            </motion.div>
          ))}
      </div>

      {/* Bento Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        {/* Upcoming Events — large */}
        <div className="lg:col-span-4 bento-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Próximos Eventos
            </h2>
            <Link href="/agenda">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                Ver todos <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                <CheckCircle2 className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <p className="font-medium text-muted-foreground">Nenhum evento pendente</p>
              <p className="text-xs text-muted-foreground/70 mt-1 mb-4">Tudo em dia! 🎉</p>
              <Link href="/agenda">
                <Button size="sm" variant="outline" className="gap-1.5">
                  <PlusCircle className="w-3.5 h-3.5" /> Adicionar evento
                </Button>
              </Link>
            </div>
          ) : (
            <motion.ul
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-2"
            >
              {upcomingEvents.map(event => {
                const subject = subjects.find(s => s.id === event.subjectId)
                return (
                  <motion.li key={event.id} variants={itemVariants}>
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors group">
                      <button
                        onClick={() => toggleEventCompletion(event.id)}
                        className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                      >
                        {event.completed
                          ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          : <Circle className="w-5 h-5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate text-sm">{event.title}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${EVENT_TYPE_COLORS[event.type] ?? EVENT_TYPE_COLORS.other}`}>
                            {event.type}
                          </span>
                          {subject && (
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 leading-tight shrink-0"
                              style={{ borderColor: subject.color, color: subject.color }}
                            >
                              {subject.name}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {formatEventDate(event.date)}
                        </span>
                      </div>
                    </div>
                  </motion.li>
                )
              })}
            </motion.ul>
          )}
        </div>

        {/* Quick Access — small */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <motion.div whileHover={{ y: -2 }} className="flex-1">
            <Link href="/subjects">
              <div className="bento-card h-full flex flex-col items-center justify-center gap-3 cursor-pointer text-center hover:border-primary/50 transition-colors group">
                <div className="p-3.5 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold">Matérias</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{subjects.length} cadastrada{subjects.length !== 1 ? "s" : ""}</div>
                </div>
              </div>
            </Link>
          </motion.div>

          <motion.div whileHover={{ y: -2 }} className="flex-1">
            <Link href="/notes">
              <div className="bento-card h-full flex flex-col items-center justify-center gap-3 cursor-pointer text-center hover:border-accent/50 transition-colors group">
                <div className="p-3.5 rounded-2xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                  <StickyNote className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold">Notas</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{notes.length} anotaç{notes.length !== 1 ? "ões" : "ão"}</div>
                </div>
              </div>
            </Link>
          </motion.div>

          <motion.div whileHover={{ y: -2 }}>
            <Link href="/agenda">
              <div className="bento-card flex items-center justify-between gap-3 cursor-pointer hover:border-emerald-500/40 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Agenda</div>
                    <div className="text-xs text-muted-foreground">{todayEvents.length} hoje</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
