"use client"

import * as React from "react"
import * as Popover from "@radix-ui/react-popover"
import {
  format, parse, isValid, startOfMonth, endOfMonth,
  eachDayOfInterval, getDay, addMonths, subMonths,
  isSameDay, isSameMonth, isToday
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ")
}

interface DatePickerProps {
  value: string // "yyyy-MM-dd"
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  required?: boolean
}

export function DatePicker({ value, onChange, placeholder = "Selecione uma data", className }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [viewDate, setViewDate] = React.useState<Date>(() => {
    if (value) {
      const parsed = parse(value, "yyyy-MM-dd", new Date())
      if (isValid(parsed)) return startOfMonth(parsed)
    }
    return startOfMonth(new Date())
  })

  const selectedDate = React.useMemo(() => {
    if (!value) return null
    const parsed = parse(value, "yyyy-MM-dd", new Date())
    return isValid(parsed) ? parsed : null
  }, [value])

  // Build calendar grid
  const days = React.useMemo(() => {
    const start = startOfMonth(viewDate)
    const end = endOfMonth(viewDate)
    return eachDayOfInterval({ start, end })
  }, [viewDate])

  const startPadding = getDay(startOfMonth(viewDate)) // 0=Sun

  const handleSelect = (day: Date) => {
    onChange(format(day, "yyyy-MM-dd"))
    setOpen(false)
  }

  const displayValue = selectedDate
    ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
    : ""

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <span>{displayValue || placeholder}</span>
          <Calendar className="h-4 w-4 opacity-50 shrink-0 ml-2" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="z-50 w-72 rounded-xl border border-border bg-popover p-3 shadow-lg animate-in fade-in-0 zoom-in-95"
          align="start"
          sideOffset={4}
        >
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setViewDate(d => subMonths(d, 1))}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold capitalize">
              {format(viewDate, "MMMM yyyy", { locale: ptBR })}
            </span>
            <button
              type="button"
              onClick={() => setViewDate(d => addMonths(d, 1))}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {weekDays.map(d => (
              <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {/* Padding for first week */}
            {Array.from({ length: startPadding }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {days.map(day => {
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
              const isCurrent = isToday(day)
              const inCurrentMonth = isSameMonth(day, viewDate)
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleSelect(day)}
                  className={cn(
                    "w-full aspect-square rounded-lg text-xs font-medium transition-colors flex items-center justify-center",
                    !inCurrentMonth && "opacity-30",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                      ? "bg-accent text-accent-foreground font-bold"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  {format(day, "d")}
                </button>
              )
            })}
          </div>

          {/* Today shortcut */}
          <div className="mt-3 pt-2 border-t border-border/50 flex justify-center">
            <button
              type="button"
              onClick={() => { handleSelect(new Date()) }}
              className="text-xs text-primary hover:underline font-medium"
            >
              Hoje
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
