"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WEEKDAYS, EVENT_CATEGORIES, type EventCategory, HUNT_STATUS } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface CalendarEvent {
  id: string;
  title: string;
  event_type: string;
  category: string;
  reference_id: string | null;
  starts_at: string;
  source: "event" | "hunt" | "boss" | "task";
  hunt_status?: string;
  location?: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const supabase = createClient();

  useEffect(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

    Promise.all([
      supabase.from("events").select("id,title,category,event_type,reference_id,starts_at").gte("starts_at", start.toISOString()).lte("starts_at", end.toISOString()).order("starts_at"),
      supabase.from("hunts").select("id,name,scheduled_at,status,hunt_type").gte("scheduled_at", start.toISOString()).lte("scheduled_at", end.toISOString()).order("scheduled_at"),
      supabase.from("bosses").select("id,name,weekday"),
      supabase.from("tasks").select("id,creature,location,scheduled_at,status,hunt_type").gte("scheduled_at", start.toISOString()).lte("scheduled_at", end.toISOString()).order("scheduled_at"),
    ]).then(([{ data: eventsData }, { data: huntsData }, { data: bossesData }, { data: tasksData }]) => {
      const mappedEvents: CalendarEvent[] = (eventsData ?? []).map((e: any) => ({
        ...e,
        title: e.title,
        event_type: e.category || e.event_type,
        category: e.category,
        starts_at: e.starts_at,
        source: "event" as const,
        reference_id: e.reference_id,
      }));

      const mappedHunts: CalendarEvent[] = (huntsData ?? []).map((h: any) => ({
        id: h.id,
        title: h.name,
        event_type: "hunt",
        category: "hunt",
        source: "hunt" as const,
        reference_id: h.id,
        starts_at: h.scheduled_at,
        hunt_status: h.status,
      }));

      const mappedTasks: CalendarEvent[] = (tasksData ?? []).map((t: any) => ({
        id: t.id,
        title: t.creature,
        event_type: "task",
        category: "task",
        source: "task" as const,
        reference_id: t.id,
        starts_at: t.scheduled_at,
        location: t.location,
        hunt_status: t.status,
      }));

      setEvents([...mappedEvents, ...mappedHunts, ...mappedTasks]);
    });
  }, [currentDate, supabase]);

  const monthLabel = currentDate.toLocaleString("pt-BR", { month: "long", year: "numeric" });
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = startOfMonth.getDay();

  function getColor(item: CalendarEvent) {
    if (item.source === "hunt") return "bg-green-500/20 text-green-400";
    if (item.source === "boss") return "bg-yellow-500/20 text-yellow-400";
    if (item.source === "task") return "bg-purple-500/20 text-purple-400";
    const c = EVENT_CATEGORIES[item.category as EventCategory];
    if (!c) return "bg-primary/20 text-primary";
    return c.color.includes("blue") ? "bg-blue-500/20 text-blue-400" :
           c.color.includes("green") ? "bg-green-500/20 text-green-400" :
           c.color.includes("yellow") ? "bg-yellow-500/20 text-yellow-400" :
           c.color.includes("red") ? "bg-red-500/20 text-red-400" :
           c.color.includes("purple") ? "bg-purple-500/20 text-purple-400" :
           c.color.includes("rose") ? "bg-rose-500/20 text-rose-400" :
           c.color.includes("orange") ? "bg-orange-500/20 text-orange-400" :
           "bg-sky-500/20 text-sky-400";
  }

  function getLink(item: CalendarEvent) {
    if (item.source === "hunt") return `/dashboard/hunts/${item.id}`;
    if (item.source === "boss") return `/dashboard/bosses/${item.id}`;
    if (item.source === "task") return `/dashboard/tasks/${item.id}`;
    if (item.event_type === "hunt") return `/dashboard/hunts/${item.reference_id}`;
    return `/dashboard/events/${item.id}`;
  }

  function getBadge(item: CalendarEvent) {
    if (item.source === "hunt") return "Hunt";
    if (item.source === "boss") return "Boss";
    if (item.source === "task") return "Task";
    const cat = EVENT_CATEGORIES[item.category as EventCategory];
    return cat?.label ?? item.category;
  }

  function statusVariant(status: string) {
    if (status === "open") return "success";
    if (status === "full") return "warning";
    if (status === "completed") return "info";
    return "danger";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agenda</h1>
        <p className="text-muted mt-1">Calendário de hunts, bosses e eventos</p>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-2 rounded-lg hover:bg-surface-hover cursor-pointer">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold capitalize">{monthLabel}</h2>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-2 rounded-lg hover:bg-surface-hover cursor-pointer">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {WEEKDAYS.map((day) => (
            <div key={day} className="p-2 text-center text-xs font-medium text-muted bg-surface">{day.substring(0, 3)}</div>
          ))}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`e-${i}`} className="p-2 bg-background min-h-[80px]" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dateStr = date.toISOString().split("T")[0];
            const dayEvents = events.filter((e) => e.starts_at.startsWith(dateStr));
            const isToday = new Date().toDateString() === date.toDateString();

            return (
              <div key={day} className={`p-2 bg-background min-h-[80px] border-t border-border/30 ${isToday ? "ring-1 ring-primary/50" : ""}`}>
                <span className={`text-xs font-medium ${isToday ? "bg-primary text-primary-foreground w-6 h-6 flex items-center justify-center rounded-full" : "text-muted"}`}>
                  {day}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <Link key={ev.id + ev.source} href={getLink(ev)} className="block">
                      <div className={`text-xs truncate px-1 py-0.5 rounded flex items-center gap-1 ${getColor(ev)}`}>
                        {ev.source === "hunt" && (
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            ev.hunt_status === "open" ? "bg-green-500" :
                            ev.hunt_status === "full" ? "bg-yellow-500" :
                            ev.hunt_status === "completed" ? "bg-blue-500" : "bg-red-500"
                          }`} />
                        )}
                        <span className="truncate">{ev.title}</span>
                      </div>
                    </Link>
                  ))}
                  {dayEvents.length > 3 && <span className="text-xs text-muted">+{dayEvents.length - 3}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Próximas Atividades</CardTitle></CardHeader>
        {events.length === 0 ? (
          <p className="text-sm text-muted p-2">Nenhuma atividade no mês.</p>
        ) : (
          <div className="space-y-1">
            {events.slice(0, 15).map((ev) => (
              <Link key={ev.id + ev.source} href={getLink(ev)} className="flex items-center justify-between p-3 rounded-lg bg-surface-hover hover:bg-border transition-colors">
                <div className="flex items-center gap-3">
                  <Badge variant="default">{getBadge(ev)}</Badge>
                  {ev.source === "hunt" && ev.hunt_status && (
                    <Badge variant={statusVariant(ev.hunt_status)}>
                      {HUNT_STATUS[ev.hunt_status as keyof typeof HUNT_STATUS] ?? ev.hunt_status}
                    </Badge>
                  )}
                  <span className="text-sm font-medium">{ev.title}</span>
                </div>
                <span className="text-xs text-muted">
                  {new Date(ev.starts_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </span>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
