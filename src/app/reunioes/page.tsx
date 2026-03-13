"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { useAuthStore } from "@/store/authStore"
import { Calendar, Users, Video, MapPin, Plus, ExternalLink, HelpCircle } from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { PremiumGate } from "@/components/ui/premium-gate"
import { fetchApi } from "@/lib/api"

interface StudyEvent {
  id: string
  subject: { name: string }
  creator: { name: string }
  date: string
  method: 'DISCORD' | 'MEET' | 'ZOOM' | 'PRESENCIAL'
  link?: string
  rsvpCount: number
  userRsvpd: boolean
}

function StudyEventsContent() {
  const [events, setEvents] = React.useState<StudyEvent[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchEvents = React.useCallback(async () => {
    try {
      const data = await fetchApi("/study-events")
      setEvents(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleRsvp = async (id: string, currentlyRsvpd: boolean) => {
    try {
      await fetchApi(`/study-events/${id}/rsvp`, {
        method: currentlyRsvpd ? "DELETE" : "POST"
      })
      fetchEvents()
    } catch (err) {
      console.error(err)
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'PRESENCIAL': return <MapPin className="w-4 h-4" />
      default: return <Video className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-8">
      {/* FAQ Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" /> Perguntas Frequentes (FAQ)
        </h2>
        <div className="grid gap-3">
          {[
            { q: "Como funcionam as reuniões?", a: "As reuniões são criadas por alunos para tirar dúvidas ou estudar para provas específicas." },
            { q: "Qualquer um pode criar?", a: "A criação de eventos de estudo é um recurso Premium, mas todos da turma podem participar." },
            { q: "Onde encontro o link?", a: "O link (Meet, Zoom ou Discord) fica disponível no card do evento após você confirmar presença." }
          ].map((faq, i) => (
            <div key={i} className="p-4 rounded-2xl bg-muted/30 border border-border/50">
              <p className="font-semibold text-sm">{faq.q}</p>
              <p className="text-xs text-muted-foreground mt-1">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Events Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Grupos de Estudo
          </h2>
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Marcar Reunião
          </Button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Carregando eventos...</div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center bg-muted/20 rounded-3xl border-2 border-dashed">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm text-muted-foreground">Nenhuma reunião marcada para suas turmas.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {events.map(event => (
              <motion.div
                key={event.id}
                layout
                className="bg-card border rounded-2xl p-5 shadow-sm space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-base">{event.subject.name}</h3>
                    <p className="text-xs text-muted-foreground">Organizado por {event.creator.name}</p>
                  </div>
                  <div className={`p-2 rounded-xl bg-primary/10 text-primary`}>
                    {getMethodIcon(event.method)}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(parseISO(event.date), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {event.rsvpCount} participantes
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant={event.userRsvpd ? "outline" : "default"}
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => handleRsvp(event.id, event.userRsvpd)}
                  >
                    {event.userRsvpd ? "Confirmado" : "Eu vou!"}
                  </Button>
                  {event.link && (
                    <Button variant="secondary" size="sm" onClick={() => window.open(event.link, "_blank")}>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default function ReunioesPage() {
  const { isPremium } = useAuthStore()

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 pb-24 sm:pb-8">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">Estudos & FAQ</h1>
        <p className="text-muted-foreground mt-1">Tire dúvidas e participe de reuniões com sua turma.</p>
      </header>

      {isPremium() ? (
        <StudyEventsContent />
      ) : (
        <PremiumGate>
          <StudyEventsContent />
        </PremiumGate>
      )}
    </div>
  )
}
