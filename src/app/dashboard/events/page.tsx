"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { VOCATIONS, type Vocation, EVENT_CATEGORIES, type EventCategory } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";
import { notifyEventCreated } from "@/lib/discord";
import { Calendar, Plus, MapPin, Shield, Clock, User, X, Pencil } from "lucide-react";
import Link from "next/link";

interface Event {
  id: string;
  title: string;
  description: string | null;
  category: EventCategory;
  location: string | null;
  min_level: number;
  max_participants: number;
  slots: Record<Vocation, number> | null;
  responsible_leader: string | null;
  starts_at: string;
  ends_at: string | null;
  status: string;
  created_by: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState("MEMBER");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<EventCategory>("event");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formMinLevel, setFormMinLevel] = useState("0");
  const [formMaxParticipants, setFormMaxParticipants] = useState("0");
  const [formSlots, setFormSlots] = useState<Record<Vocation, number>>({ EK: 0, RP: 0, MS: 0, ED: 0, MK: 0 });
  const [formLeader, setFormLeader] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: eventsData }, { data: profile }] = await Promise.all([
      supabase.from("events").select("*").order("starts_at", { ascending: true }),
      supabase.from("profiles").select("role").eq("id", user.id).single(),
    ]);

    setEvents(eventsData ?? []);
    setMyRole(profile?.role ?? "MEMBER");
    setLoading(false);
  }

  function resetForm() {
    setFormTitle("");
    setFormCategory("event");
    setFormDate("");
    setFormTime("");
    setFormLocation("");
    setFormMinLevel("0");
    setFormMaxParticipants("0");
    setFormSlots({ EK: 0, RP: 0, MS: 0, ED: 0, MK: 0 });
    setFormLeader("");
    setFormDescription("");
    setFormError("");
    setEditingEvent(null);
  }

  async function handleSave() {
    if (!formTitle) { setFormError("Nome do evento é obrigatório."); return; }
    if (!formDate || !formTime) { setFormError("Data e horário são obrigatórios."); return; }
    setSaving(true);
    setFormError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const startsAt = new Date(`${formDate}T${formTime}:00`).toISOString();
    const payload = {
      title: formTitle,
      category: formCategory,
      starts_at: startsAt,
      location: formLocation || null,
      min_level: Number(formMinLevel) || 0,
      max_participants: Number(formMaxParticipants) || 0,
      slots: formSlots,
      responsible_leader: formLeader || null,
      description: formDescription || null,
    };

    let error;
    let newEventId: string | null = null;
    if (editingEvent) {
      const { error: err } = await supabase.from("events").update(payload).eq("id", editingEvent.id);
      error = err;
      newEventId = editingEvent.id;
    } else {
      const { data: newEv, error: err } = await supabase.from("events").insert({ ...payload, created_by: user.id }).select("id").single();
      error = err;
      if (newEv) newEventId = newEv.id;
    }

    if (error) { setFormError(error.message); setSaving(false); return; }

    if (!editingEvent) {
      const { data: members } = await supabase.from("profiles").select("id");
      if (members) {
        const notifications = members.map((m) => ({
          user_id: m.id,
          title: "Novo evento",
          message: `${formTitle} — ${new Date(startsAt).toLocaleDateString("pt-BR")}`,
          read: false,
          link: "/dashboard/events",
        }));
        await supabase.from("notifications").insert(notifications);
      }

      const cat = EVENT_CATEGORIES[formCategory] ?? EVENT_CATEGORIES.event;
      notifyEventCreated({
        title: formTitle,
        eventId: newEventId ?? "",
        category: cat.label,
        categoryIcon: cat.icon,
        startsAt: startsAt,
        location: formLocation || undefined,
        leader: formLeader || undefined,
        minLevel: Number(formMinLevel) || undefined,
        maxParticipants: Number(formMaxParticipants) || undefined,
      });
    }

    setModalOpen(false);
    resetForm();
    setSaving(false);
    loadAll();
  }

  async function handleDelete(id: string) {
    await supabase.from("events").delete().eq("id", id);
    loadAll();
  }

  function openEdit(ev: Event) {
    setEditingEvent(ev);
    setFormTitle(ev.title);
    setFormCategory(ev.category);
    setFormDate(ev.starts_at.split("T")[0]);
    setFormTime(ev.starts_at.split("T")[1]?.substring(0, 5) ?? "");
    setFormLocation(ev.location ?? "");
    setFormMinLevel(String(ev.min_level));
    setFormMaxParticipants(String(ev.max_participants ?? 0));
    setFormSlots((ev.slots as Record<Vocation, number>) ?? { EK: 0, RP: 0, MS: 0, ED: 0, MK: 0 });
    setFormLeader(ev.responsible_leader ?? "");
    setFormDescription(ev.description ?? "");
    setFormError("");
    setModalOpen(true);
  }

  const isAdmin = myRole === "LEADER" || myRole === "VICE";

  if (loading) return <div className="space-y-6 animate-pulse"><div className="h-8 w-48 bg-surface rounded" /><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-40 bg-surface rounded-xl" />)}</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Eventos Oficiais</h1>
          <p className="text-muted mt-1">Quests, acessos, bosses e eventos organizados pela liderança</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { resetForm(); setModalOpen(true); }}>
            <Plus size={16} /> Criar Evento
          </Button>
        )}
      </div>

      {events.length === 0 ? (
        <Card><p className="text-sm text-muted text-center py-8">Nenhum evento cadastrado.</p></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((ev) => {
            const cat = EVENT_CATEGORIES[ev.category] ?? EVENT_CATEGORIES.event;
            return (
              <Card key={ev.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={cat.color.includes("blue") ? "info" : "default"}>{cat.icon} {cat.label}</Badge>
                    </div>
                    <h3 className="font-semibold">{ev.title}</h3>
                    {ev.description && <p className="text-sm text-muted mt-1">{ev.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted">
                      <span className="flex items-center gap-1"><Clock size={14} />{new Date(ev.starts_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                      {ev.location && <span className="flex items-center gap-1"><MapPin size={14} />{ev.location}</span>}
                      {ev.min_level > 0 && <span className="flex items-center gap-1"><Shield size={14} />Level {ev.min_level}+</span>}
                    </div>
                    {ev.responsible_leader && <p className="text-xs text-muted mt-1"><User size={12} className="inline mr-1" />{ev.responsible_leader}</p>}
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(ev)} className="p-1.5 rounded-lg hover:bg-surface-hover cursor-pointer"><Pencil size={14} className="text-muted" /></button>
                      <button onClick={() => handleDelete(ev.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer"><X size={14} className="text-red-400" /></button>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <Link href={`/dashboard/events/${ev.id}`}>
                    <Button size="sm" variant="outline">Ver Detalhes</Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {isAdmin && (
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingEvent ? "Editar Evento" : "Criar Evento Oficial"} className="max-w-lg">
          <div className="space-y-4">
            <Input label="Nome do Evento" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Last GT" />
            <Select
              label="Categoria"
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value as EventCategory)}
              options={Object.entries(EVENT_CATEGORIES).map(([k, v]) => ({ value: k, label: `${v.icon} ${v.label}` }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Data" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
              <Input label="Horário" type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} />
            </div>
            <Input label="Local" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} placeholder="Temple de Thais" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Nível Mínimo" type="number" value={formMinLevel} onChange={(e) => setFormMinLevel(e.target.value)} placeholder="250" />
              <Input label="Máx. Participantes" type="number" value={formMaxParticipants} onChange={(e) => setFormMaxParticipants(e.target.value)} placeholder="25" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Vagas por Vocação</label>
              <div className="grid grid-cols-5 gap-2">
                {(Object.keys(VOCATIONS) as Vocation[]).map((voc) => (
                  <div key={voc}>
                    <label className={`block text-xs mb-1 ${VOCATIONS[voc].color}`}>{VOCATIONS[voc].short}</label>
                    <input type="number" min="0" max="100" value={formSlots[voc] ?? 0} onChange={(e) => setFormSlots((prev) => ({ ...prev, [voc]: Number(e.target.value) || 0 }))} className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-foreground text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                ))}
              </div>
            </div>
            <Input label="Líder Responsável" value={formLeader} onChange={(e) => setFormLeader(e.target.value)} placeholder="Nome do líder" />
            <Input label="Observações" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Detalhes adicionais..." />
            {formError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">{formError}</div>}
            <Button onClick={handleSave} className="w-full" disabled={saving}>{saving ? "Salvando..." : editingEvent ? "Salvar" : "Criar Evento"}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
