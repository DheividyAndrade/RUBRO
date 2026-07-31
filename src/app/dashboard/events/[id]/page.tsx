"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { VOCATIONS, type Vocation, EVENT_CATEGORIES, type EventCategory } from "@/lib/utils";
import { notifyEventUpdated } from "@/lib/discord";
import { ArrowLeft, Clock, MapPin, Shield, User, Check, X, AlertCircle } from "lucide-react";

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
  created_by: string;
  discord_message_id: string | null;
  status: string;
}

interface Participant {
  id: string;
  user_id: string;
  character_id: string;
  confirmed: boolean;
  character: { name: string; level: number; vocation: Vocation } | null;
  profile: { display_name: string } | null;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [myChars, setMyChars] = useState<{ id: string; name: string; vocation: Vocation; level: number }[]>([]);
  const [myUserId, setMyUserId] = useState("");
  const [myRole, setMyRole] = useState("MEMBER");
  const [loading, setLoading] = useState(true);
  const [joinModal, setJoinModal] = useState(false);
  const [selectedCharId, setSelectedCharId] = useState("");
  const [joinMsg, setJoinMsg] = useState("");

  const supabase = createClient();

  useEffect(() => { loadEvent(); }, [eventId]);

  async function loadEvent() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setMyUserId(user.id);

    const [{ data: ev }, { data: parts }, { data: chars }, { data: profile }] = await Promise.all([
      supabase.from("events").select("*").eq("id", eventId).single(),
      supabase.from("event_participants").select("*").eq("event_id", eventId),
      supabase.from("characters").select("id,name,vocation,level").eq("user_id", user.id),
      supabase.from("profiles").select("role").eq("id", user.id).single(),
    ]);

    const charIds = [...new Set((parts ?? []).map((p: any) => p.character_id).filter(Boolean))];
    const { data: charData } = charIds.length > 0
      ? await supabase.from("characters").select("id, name, level, vocation").in("id", charIds)
      : { data: [] };
    const charMap = new Map((charData ?? []).map((c: any) => [c.id, c]));

    const mapped = (parts ?? []).map((p: any) => ({
      ...p,
      character: charMap.get(p.character_id) ?? null,
      profile: { display_name: "" },
    }));

    setEvent(ev);
    setParticipants(mapped);
    setMyChars(chars ?? []);
    setMyRole(profile?.role ?? "MEMBER");
    setLoading(false);
  }

  async function handleJoin() {
    if (!selectedCharId) { setJoinMsg("Selecione um personagem."); return; }
    const char = myChars.find((c) => c.id === selectedCharId);
    if (!char || !event) return;

    const slots = (event.slots as Record<Vocation, number>) ?? {};
    const allSlotsZero = Object.values(slots).every((v) => v === 0);
    const maxForVoc = allSlotsZero ? 999 : (slots[char.vocation] ?? 0);

    if (!allSlotsZero && maxForVoc > 0) {
      const current = participants.filter((p) => p.character?.vocation === char.vocation).length;
      if (current >= maxForVoc) {
        setJoinMsg(`Vagas de ${VOCATIONS[char.vocation].short} esgotadas (${current}/${maxForVoc}).`);
        return;
      }
    } else if (maxForVoc === 0 && !allSlotsZero) {
      setJoinMsg(`Não há vagas para ${VOCATIONS[char.vocation].short} neste evento.`);
      return;
    }

    if (event.min_level > 0 && char.level < event.min_level) {
      setJoinMsg(`Seu nível (${char.level}) está abaixo do mínimo (${event.min_level}).`);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: err } = await supabase.from("event_participants").insert({
      event_id: eventId,
      user_id: user.id,
      character_id: char.id,
      confirmed: false,
    });

    if (err) {
      if (err.code === "23505") setJoinMsg("Você já está inscrito neste evento.");
      else setJoinMsg(err.message);
      return;
    }

    if (event) {
      if (event.discord_message_id) {
        const cat = EVENT_CATEGORIES[event.category] ?? EVENT_CATEGORIES.event;
        const pNames = participants.map((p) => {
          if (p.character) return { name: p.character.name, vocation: p.character.vocation };
          return null;
        }).filter(Boolean) as { name: string; vocation: string }[];
        pNames.push({ name: char.name, vocation: char.vocation });

        notifyEventUpdated({
          eventTitle: event.title,
          eventId: eventId,
          messageId: event.discord_message_id,
          category: cat.label,
          categoryIcon: cat.icon,
          startsAt: event.starts_at,
          location: event.location || undefined,
          leader: event.responsible_leader || undefined,
          minLevel: event.min_level || undefined,
          maxParticipants: event.max_participants || undefined,
          participants: pNames,
        });
      }
    }

    setJoinMsg("Inscrição realizada com sucesso!");
    setTimeout(() => { setJoinModal(false); setJoinMsg(""); setSelectedCharId(""); }, 1200);
    loadEvent();
  }

  async function handleRemove(participantId: string) {
    await supabase.from("event_participants").delete().eq("id", participantId);
    loadEvent();
  }

  async function handleApprove(participantId: string) {
    await supabase.from("event_participants").update({ confirmed: true }).eq("id", participantId);
    loadEvent();
  }

  const isAdmin = myRole === "LEADER" || myRole === "VICE";

  if (loading || !event) {
    return <div className="space-y-6 animate-pulse"><div className="h-8 w-48 bg-surface rounded" /><div className="h-64 bg-surface rounded-xl" /></div>;
  }

  const cat = EVENT_CATEGORIES[event.category] ?? EVENT_CATEGORIES.event;
  const slots = (event.slots as Record<Vocation, number>) ?? {};

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted hover:text-foreground cursor-pointer">
        <ArrowLeft size={16} /> Voltar
      </button>

      <div>
        <div className="flex items-center gap-3 mb-2">
          <Badge variant={cat.color.includes("blue") ? "info" : "default"}>{cat.icon} {cat.label}</Badge>
        </div>
        <h1 className="text-2xl font-bold">{event.title}</h1>
        {event.description && <p className="text-muted mt-2">{event.description}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-2 text-sm"><Clock size={16} className="text-muted" /><span>{new Date(event.starts_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span></div>
        </Card>
        {event.location && (
          <Card>
            <div className="flex items-center gap-2 text-sm"><MapPin size={16} className="text-muted" /><span>{event.location}</span></div>
          </Card>
        )}
        {event.min_level > 0 && (
          <Card>
            <div className="flex items-center gap-2 text-sm"><Shield size={16} className="text-muted" /><span>Level {event.min_level}+</span></div>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Participantes ({participants.length}{event.max_participants > 0 ? `/${event.max_participants}` : ""})</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-1">
            {participants.length === 0 ? (
              <p className="text-sm text-muted p-2">Nenhum inscrito ainda.</p>
            ) : (
              participants.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-surface-hover">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${p.character?.vocation ? VOCATIONS[p.character.vocation].color : ""}`}>
                      {p.character?.vocation ? VOCATIONS[p.character.vocation].short : "?"}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{p.character?.name ?? "..."}</p>
                      <p className="text-xs text-muted">{p.profile?.display_name ?? "..."} · Level {p.character?.level ?? "?"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.confirmed ? (
                      <Badge variant="success">Confirmado</Badge>
                    ) : (
                      <>
                        <Badge variant="warning">Pendente</Badge>
                        {isAdmin && (
                          <button onClick={() => handleApprove(p.id)} className="p-1 rounded hover:bg-success/20 cursor-pointer" title="Aprovar">
                            <Check size={14} className="text-success" />
                          </button>
                        )}
                      </>
                    )}
                    {(isAdmin || p.user_id === myUserId) && (
                      <button onClick={() => handleRemove(p.id)} className="p-1 rounded hover:bg-red-500/10 cursor-pointer" title="Remover">
                        <X size={14} className="text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>Vagas por Vocação</CardTitle></CardHeader>
          <div className="space-y-2">
            {(Object.keys(VOCATIONS) as Vocation[]).map((voc) => {
              const max = slots[voc] ?? 0;
              const current = participants.filter((p) => p.character?.vocation === voc).length;
              if (max === 0) return null;
              return (
                <div key={voc} className="flex items-center justify-between p-2 rounded-lg bg-surface-hover">
                  <span className={`font-medium ${VOCATIONS[voc].color}`}>{VOCATIONS[voc].label}</span>
                  <span className={`text-sm ${current >= max ? "text-red-400" : "text-muted"}`}>
                    {current}/{max} {current >= max ? "✓ Lotado" : ""}
                  </span>
                </div>
              );
            })}
            {Object.values(slots).every((v) => v === 0) && (
              <p className="text-sm text-muted">Sem limite por vocação.</p>
            )}
          </div>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button onClick={() => { setSelectedCharId(""); setJoinMsg(""); setJoinModal(true); }}>
          Participar
        </Button>
        {isAdmin && (
          <>
            <Button variant="outline" onClick={() => router.push("/dashboard/admin")}>Gerenciar</Button>
          </>
        )}
      </div>

      {/* Simple join modal */}
      {joinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setJoinModal(false)}>
          <div className="bg-surface border border-border rounded-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Inscrever-se</h3>
            <div className="space-y-4">
              <Select
                label="Personagem"
                value={selectedCharId}
                onChange={(e) => setSelectedCharId(e.target.value)}
                options={[
                  { value: "", label: "Selecione..." },
                  ...myChars.map((c) => ({ value: c.id, label: `${c.name} (${VOCATIONS[c.vocation].short}) Level ${c.level}` })),
                ]}
              />
              {joinMsg && (
                <div className={`p-3 rounded-lg text-sm ${joinMsg.includes("sucesso") ? "bg-success/10 border border-success/30 text-success" : "bg-red-500/10 border border-red-500/30 text-red-400"} flex items-center gap-2`}>
                  {joinMsg.includes("sucesso") ? <Check size={16} /> : <AlertCircle size={16} />}{joinMsg}
                </div>
              )}
              <Button onClick={handleJoin} className="w-full" disabled={!selectedCharId}>Confirmar Inscrição</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
