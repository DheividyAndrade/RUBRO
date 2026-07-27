"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Swords, Skull, ScrollText, Calendar, Clock, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { HUNT_STATUS, EVENT_CATEGORIES, type EventCategory } from "@/lib/utils";

interface Hunt {
  id: string;
  name: string;
  scheduled_at: string;
  status: string;
  hunt_type: string;
}

interface Boss {
  id: string;
  name: string;
  weekday: number;
}

interface Event {
  id: string;
  title: string;
  category: EventCategory;
  starts_at: string;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function DashboardPage() {
  const [hunts, setHunts] = useState<Hunt[]>([]);
  const [bosses, setBosses] = useState<Boss[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [todayBosses, setTodayBosses] = useState<Boss[]>([]);
  const [todayEvents, setTodayEvents] = useState<Event[]>([]);
  const [weekHunts, setWeekHunts] = useState<{ day: number; name: string; id: string }[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const now = new Date().toISOString();
      const today = new Date().getDay();
      const todayStr = new Date().toISOString().split("T")[0];

      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59);

      const [{ data: huntsData }, { data: bossesData }, { data: eventsData }, { data: weekHuntsData }] = await Promise.all([
        supabase.from("hunts").select("id,name,scheduled_at,status,hunt_type").in("status", ["open","full"]).gte("scheduled_at", now).order("scheduled_at").limit(5),
        supabase.from("bosses").select("id,name,weekday").order("name"),
        supabase.from("events").select("id,title,category,starts_at").gte("starts_at", now).order("starts_at").limit(5),
        supabase.from("hunts").select("id,name,scheduled_at").gte("scheduled_at", startOfWeek.toISOString()).lte("scheduled_at", endOfWeek.toISOString()).order("scheduled_at"),
      ]);

      setHunts(huntsData ?? []);
      setBosses(bossesData ?? []);
      setTodayBosses((bossesData ?? []).filter((b) => b.weekday === today));
      setEvents(eventsData ?? []);
      setTodayEvents((eventsData ?? []).filter((e) => e.starts_at.startsWith(todayStr)));

      const mapped = (weekHuntsData ?? []).map((h: any) => ({
        id: h.id,
        name: h.name,
        day: new Date(h.scheduled_at).getDay(),
      }));
      setWeekHunts(mapped);
    }
    load();
  }, [supabase]);

  function fmt(dateStr: string) {
    return new Date(dateStr).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted mt-1">Bem-vindo ao gerenciador da guilda Rubro</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><Swords className="w-5 h-5 text-primary" /><CardTitle>Próximas Hunts</CardTitle></div>
          </CardHeader>
          {hunts.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma hunt agendada.</p>
          ) : (
            <div className="space-y-3">
              {hunts.map((h) => (
                <Link key={h.id} href={`/dashboard/hunts/${h.id}`} className="block p-3 rounded-lg bg-surface-hover hover:bg-border transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{h.name}</span>
                      {h.hunt_type === "solo" && <Badge variant="default">Solo</Badge>}
                    </div>
                    <Badge variant={h.status === "open" ? "success" : "warning"}>{HUNT_STATUS[h.status as keyof typeof HUNT_STATUS] ?? h.status}</Badge>
                  </div>
                  <p className="text-xs text-muted mt-1"><Clock size={12} className="inline mr-1" />{fmt(h.scheduled_at)}</p>
                </Link>
              ))}
              <Link href="/dashboard/hunts"><Button variant="outline" size="sm" className="w-full">Ver todas <ArrowRight size={14} /></Button></Link>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><Skull className="w-5 h-5 text-yellow-400" /><CardTitle>Bosses Hoje</CardTitle></div>
          </CardHeader>
          {todayBosses.length === 0 ? (
            <p className="text-sm text-muted">Nenhum boss para hoje.</p>
          ) : (
            <div className="space-y-2">
              {todayBosses.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-hover">
                  <span className="text-sm font-medium">{b.name}</span>
                  <Badge variant="info">{WEEKDAYS[b.weekday]}</Badge>
                </div>
              ))}
            </div>
          )}
          <Link href="/dashboard/bosses" className="block mt-4"><Button variant="outline" size="sm" className="w-full">Ver Bosses</Button></Link>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><ScrollText className="w-5 h-5 text-blue-400" /><CardTitle>Eventos</CardTitle></div>
          </CardHeader>
          {events.length === 0 ? (
            <p className="text-sm text-muted">Nenhum evento próximo.</p>
          ) : (
            <div className="space-y-3">
              {events.map((ev) => {
                const cat = EVENT_CATEGORIES[ev.category] ?? EVENT_CATEGORIES.event;
                return (
                  <Link key={ev.id} href={`/dashboard/events/${ev.id}`} className="block p-3 rounded-lg bg-surface-hover hover:bg-border transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{ev.title}</span>
                      <span className="text-xs text-muted">{cat.icon}</span>
                    </div>
                    <p className="text-xs text-muted mt-1"><Clock size={12} className="inline mr-1" />{fmt(ev.starts_at)}</p>
                  </Link>
                );
              })}
              <Link href="/dashboard/events"><Button variant="outline" size="sm" className="w-full">Ver Eventos</Button></Link>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><div className="flex items-center gap-2"><Calendar className="w-5 h-5 text-green-400" /><CardTitle>Agenda Semanal</CardTitle></div></CardHeader>
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((d, i) => (
              <div key={i} className="text-xs text-muted">{d}</div>
            ))}
            {Array.from({ length: 7 }).map((_, i) => {
              const dayBosses = bosses.filter((b) => b.weekday === i);
              const dayHunts = weekHunts.filter((h) => h.day === i);
              const hasActivity = dayBosses.length > 0 || dayHunts.length > 0;
              return (
                <div key={i} className={`p-2 rounded text-xs ${hasActivity ? "bg-primary/20 text-primary font-medium" : "text-muted"}`}>
                  {dayBosses.slice(0, 2).map((b) => <div key={b.id} className="truncate">💀 {b.name}</div>)}
                  {dayHunts.slice(0, 2).map((h) => <div key={h.id} className="truncate">⚔️ {h.name}</div>)}
                  {!hasActivity && "-"}
                </div>
              );
            })}
          </div>
          <Link href="/dashboard/calendar" className="block mt-4"><Button variant="outline" size="sm" className="w-full">Abrir agenda</Button></Link>
        </Card>

        <Card>
          <CardHeader><div className="flex items-center gap-2"><Users className="w-5 h-5 text-purple-400" /><CardTitle>Ações Rápidas</CardTitle></div></CardHeader>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/dashboard/hunts"><Button variant="outline" className="w-full h-20 flex-col gap-1"><Swords size={20} /><span className="text-xs">Criar Hunt</span></Button></Link>
            <Link href="/dashboard/profile"><Button variant="outline" className="w-full h-20 flex-col gap-1"><UserCircleIcon /><span className="text-xs">Meus Chars</span></Button></Link>
            <Link href="/dashboard/bosses"><Button variant="outline" className="w-full h-20 flex-col gap-1"><Skull size={20} /><span className="text-xs">Bosses</span></Button></Link>
            <Link href="/dashboard/events"><Button variant="outline" className="w-full h-20 flex-col gap-1"><Calendar size={20} /><span className="text-xs">Eventos</span></Button></Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

function UserCircleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
