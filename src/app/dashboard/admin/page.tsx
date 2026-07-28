"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { VOCATIONS, type Vocation } from "@/lib/utils";
import { Shield, Users, UserX, Trophy, Swords, Skull, ScrollText, Check, X, Plus, Trash2 } from "lucide-react";

interface Profile {
  id: string;
  display_name: string;
  role: string;
  characters: { name: string; vocation: Vocation; level: number; is_main: boolean }[];
}

interface PendingEvent {
  id: string;
  title: string;
  category: string;
  starts_at: string;
}

interface PendingParticipant {
  id: string;
  user_id: string;
  character_id: string;
  confirmed: boolean;
  event_id: string;
  profile: { display_name: string } | null;
  character: { name: string; vocation: Vocation; level: number } | null;
  event: { title: string } | null;
}

export default function AdminPage() {
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<"members" | "hunts" | "events" | "guild">("members");

  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: myProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    setIsAdmin(myProfile?.role === "LEADER" || myProfile?.role === "VICE");

    const [{ data: profiles }, { data: hunts }, { data: events }, { data: allChars }] = await Promise.all([
      supabase.from("profiles").select("*").order("role").order("display_name"),
      supabase.from("hunts").select("id,name,scheduled_at,status").order("scheduled_at", { ascending: false }).limit(30),
      supabase.from("events").select("id,title,category,starts_at").order("starts_at", { ascending: false }).limit(20),
      supabase.from("characters").select("id,name,vocation,level,is_main,user_id"),
    ]);

    const charsByUser = new Map<string, any[]>();
    (allChars ?? []).forEach((c: any) => {
      if (!charsByUser.has(c.user_id)) charsByUser.set(c.user_id, []);
      charsByUser.get(c.user_id)!.push(c);
    });

    const enriched = (profiles ?? []).map((p: any) => ({
      ...p,
      characters: charsByUser.get(p.id) ?? [],
    }));

    setMembers(enriched);
    setHunts(hunts ?? []);
    setEvents(events ?? []);
    setLoading(false);

    const { data: gm } = await supabase.from("guild_members").select("*").order("character_name");
    setGuildMembers(gm ?? []);
  }

  async function handleUpdateRole(userId: string, role: string) {
    await supabase.from("profiles").update({ role }).eq("id", userId);
    loadData();
  }

  async function handleRemoveMember(userId: string) {
    if (!confirm("Remover este membro? A conta será mantida, apenas rebaixado.")) return;
    await supabase.from("profiles").update({ role: "MEMBER" }).eq("id", userId);
    loadData();
  }

  async function handleCancelHunt(huntId: string) {
    await supabase.from("hunts").update({ status: "cancelled" }).eq("id", huntId);
    loadData();
  }

  async function handleCompleteHunt(huntId: string) {
    await supabase.from("hunts").update({ status: "completed" }).eq("id", huntId);
    loadData();
  }

  async function handleCancelEvent(eventId: string) {
    // Cancel event
    loadData();
  }

  const [hunts, setHunts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [guildMembers, setGuildMembers] = useState<any[]>([]);
  const [newMemberName, setNewMemberName] = useState("");

  const roleBadge: Record<string, string> = {
    LEADER: "bg-primary/20 text-primary",
    VICE: "bg-yellow-500/20 text-yellow-400",
    MEMBER: "bg-surface-hover text-muted",
  };

  const roleLabel: Record<string, string> = {
    LEADER: "Líder", VICE: "Vice-Líder", MEMBER: "Membro",
  };

  if (loading) return <div className="space-y-6 animate-pulse"><div className="h-8 w-48 bg-surface rounded" /><div className="h-96 bg-surface rounded-xl" /></div>;

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold">Painel do Líder</h1><p className="text-muted mt-1">Acesso restrito a líderes e vice-líderes</p></div>
        <Card><p className="text-sm text-muted text-center py-8">Você não tem permissão.</p></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Painel do Líder</h1>
        <p className="text-muted mt-1">Gerenciar membros, hunts e eventos oficiais</p>
      </div>

      <div className="flex gap-2 border-b border-border pb-2">
        {[
          { key: "members" as const, label: "Membros", icon: Users },
          { key: "hunts" as const, label: "Hunts", icon: Swords },
          { key: "events" as const, label: "Eventos", icon: ScrollText },
          { key: "guild" as const, label: "Guild", icon: Shield },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              tab === t.key ? "bg-primary/10 text-primary" : "text-muted hover:text-foreground"
            }`}
          >
            <t.icon size={16} />{t.label}
          </button>
        ))}
      </div>

      {tab === "members" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl"><Users size={24} className="text-primary" /></div>
                <div><p className="text-2xl font-bold">{members.length}</p><p className="text-sm text-muted">Membros</p></div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-success/10 rounded-xl"><Swords size={24} className="text-success" /></div>
                <div><p className="text-2xl font-bold">{members.filter((m) => m.characters.length > 0).length}</p><p className="text-sm text-muted">Com personagens</p></div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-500/10 rounded-xl"><Trophy size={24} className="text-yellow-400" /></div>
                <div><p className="text-2xl font-bold">{members.reduce((acc, m) => acc + m.characters.length, 0)}</p><p className="text-sm text-muted">Personagens</p></div>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Membros da Guilda</CardTitle></CardHeader>
            <div className="space-y-1">
              {members.map((m) => {
                const mainChar = m.characters.find((c: any) => c.is_main) ?? m.characters[0];
                return (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-hover">
                    <div>
                      <p className="text-sm font-medium">{m.display_name}</p>
                      {mainChar && (
                        <p className="text-xs text-muted">
                          {mainChar.name} · <span className={VOCATIONS[mainChar.vocation].color}>{VOCATIONS[mainChar.vocation].short}</span> Level {mainChar.level}
                          {m.characters.length > 1 && ` +${m.characters.length - 1}`}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge[m.role] ?? roleBadge.MEMBER}`}>
                        {roleLabel[m.role] ?? "Membro"}
                      </span>
                      <Select
                        value={m.role}
                        onChange={(e) => handleUpdateRole(m.id, e.target.value)}
                        options={[
                          { value: "LEADER", label: "Líder" },
                          { value: "VICE", label: "Vice" },
                          { value: "MEMBER", label: "Membro" },
                        ]}
                        className="w-28 text-xs"
                      />
                      <button onClick={() => handleRemoveMember(m.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer">
                        <UserX size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {tab === "hunts" && (
        <Card>
          <CardHeader><CardTitle>Todas as Hunts</CardTitle></CardHeader>
          <div className="space-y-1">
            {hunts.length === 0 ? (
              <p className="text-sm text-muted p-2">Nenhuma hunt.</p>
            ) : (
              hunts.map((h) => (
                <div key={h.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-hover">
                  <div>
                    <p className="text-sm font-medium">{h.name}</p>
                    <p className="text-xs text-muted">{new Date(h.scheduled_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={h.status === "open" ? "success" : h.status === "full" ? "warning" : "danger"}>{h.status}</Badge>
                    {h.status !== "completed" && h.status !== "cancelled" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleCompleteHunt(h.id)}>Encerrar</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleCancelHunt(h.id)}>Cancelar</Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {tab === "events" && (
        <Card>
          <CardHeader><CardTitle>Eventos Oficiais</CardTitle></CardHeader>
          <div className="space-y-1">
            {events.length === 0 ? (
              <p className="text-sm text-muted p-2">Nenhum evento.</p>
            ) : (
              events.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-hover">
                  <div>
                    <p className="text-sm font-medium">{ev.title}</p>
                    <p className="text-xs text-muted">{ev.category} · {new Date(ev.starts_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleCancelEvent(ev.id)}>Cancelar</Button>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {tab === "guild" && (
        <Card>
          <CardHeader>
            <CardTitle>Membros da Guilda (Rubinot)</CardTitle>
            <p className="text-sm text-muted">Nomes aprovados para registro no site</p>
          </CardHeader>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Nome do personagem"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              className="flex-1"
            />
            <Button size="sm" onClick={async () => {
              if (!newMemberName.trim()) return;
              const { error } = await supabase.from("guild_members").insert({ character_name: newMemberName.trim() });
              if (!error) { setNewMemberName(""); loadData(); }
            }}>
              <Plus size={14} className="mr-1" /> Adicionar
            </Button>
          </div>
          <div className="space-y-1">
            {guildMembers.length === 0 ? (
              <p className="text-sm text-muted p-2">Nenhum membro cadastrado.</p>
            ) : (
              guildMembers.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-hover">
                  <span className="text-sm font-medium">{m.character_name}</span>
                  <button
                    onClick={async () => {
                      await supabase.from("guild_members").delete().eq("id", m.id);
                      loadData();
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer"
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
