"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { VOCATIONS, type Vocation, WEEKDAYS } from "@/lib/utils";
import { Skull, Plus, Calendar, Shield, X, ExternalLink, Users, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { notifyBossCreated, notifyBossRotationCreated, notifyBossRotationUpdated } from "@/lib/discord";

interface Boss {
  id: string;
  name: string;
  weekday: number;
  spawn_interval: number;
  is_official: boolean;
  max_participants: number;
  discord_message_id: string | null;
  rotation_group: string | null;
  last_killed_at: string | null;
  notes: string | null;
  created_by: string;
}

export default function BossesPage() {
  const [bosses, setBosses] = useState<Boss[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState("MEMBER");
  const [modalOpen, setModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formWeekday, setFormWeekday] = useState("0");
  const [formInterval, setFormInterval] = useState("15");
  const [formNotes, setFormNotes] = useState("");
  const [formOfficial, setFormOfficial] = useState(false);
  const [formMaxPlayers, setFormMaxPlayers] = useState("0");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [rotationModalOpen, setRotationModalOpen] = useState(false);
  const [rotationList, setRotationList] = useState<{ name: string; weekday: string; interval: string; minLevel: string; maxPlayers: string }[]>([]);
  const [savingRotation, setSavingRotation] = useState(false);
  const [joinAllModal, setJoinAllModal] = useState(false);
  const [joinAllGroup, setJoinAllGroup] = useState<string | null>(null);
  const [joinAllCharId, setJoinAllCharId] = useState("");
  const [myChars, setMyChars] = useState<{ id: string; name: string; vocation: string }[]>([]);
  const [joiningAll, setJoiningAll] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: bossData }, { data: profile }, { data: chars }] = await Promise.all([
      supabase.from("bosses").select("*").order("weekday").order("name"),
      supabase.from("profiles").select("role").eq("id", user.id).single(),
      supabase.from("characters").select("id,name,vocation").eq("user_id", user.id),
    ]);

    setBosses(bossData ?? []);
    setMyRole(profile?.role ?? "MEMBER");
    setMyChars(chars ?? []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!formName) { setFormError("Nome do boss é obrigatório."); return; }
    setSaving(true);
    setFormError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: newBoss, error } = await supabase.from("bosses").insert({
      created_by: user.id,
      name: formName,
      weekday: Number(formWeekday),
      spawn_interval: Number(formInterval) || 15,
      is_official: isAdmin && formOfficial,
      max_participants: Number(formMaxPlayers) || 0,
      notes: formNotes || null,
    }).select("id").single();

    if (error) { setFormError(error.message); setSaving(false); return; }

    if (newBoss) {
      const messageId = await notifyBossCreated({
        name: formName,
        bossId: newBoss.id,
        weekday: Number(formWeekday),
        spawnInterval: Number(formInterval) || 15,
        isOfficial: isAdmin && formOfficial,
        maxParticipants: Number(formMaxPlayers) || 0,
      });
      if (messageId) {
        await supabase.from("bosses").update({ discord_message_id: messageId }).eq("id", newBoss.id);
      }
    }

    setModalOpen(false);
    setFormName("");
    setFormWeekday("0");
    setFormInterval("15");
    setFormNotes("");
    setFormOfficial(false);
    setFormMaxPlayers("0");
    setSaving(false);
    loadAll();
  }

  async function handleCreateRotation() {
    const valid = rotationList.filter((r) => r.name.trim());
    if (valid.length === 0) { return; }
    setSavingRotation(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const rotationId = crypto.randomUUID();

    const bosses = valid.map((r) => ({
      created_by: user.id,
      name: r.name.trim(),
      weekday: Number(r.weekday) || 0,
      spawn_interval: Number(r.interval) || 15,
      min_level: Number(r.minLevel) || 0,
      max_participants: Number(r.maxPlayers) || 0,
      rotation_group: rotationId,
    }));

    const { data: created, error } = await supabase.from("bosses").insert(bosses).select("id");
    if (error || !created) { setSavingRotation(false); return; }

    const messageId = await notifyBossRotationCreated(
      created.map((b: any, i: number) => ({
        name: valid[i].name.trim(),
        bossId: b.id,
        weekday: Number(valid[i].weekday) || 0,
        spawnInterval: Number(valid[i].interval) || 15,
        minLevel: Number(valid[i].minLevel) || 0,
        maxParticipants: Number(valid[i].maxPlayers) || 0,
      }))
    );

    if (messageId) {
      await supabase.from("bosses").update({ discord_message_id: messageId }).in("id", created.map((b: any) => b.id));
    }

    setRotationModalOpen(false);
    setRotationList([]);
    setSavingRotation(false);
    loadAll();
  }

  function addRotationRow() {
    setRotationList((prev) => [...prev, { name: "", weekday: "0", interval: "15", minLevel: "0", maxPlayers: "0" }]);
  }

  function updateRotationRow(index: number, field: string, value: string) {
    setRotationList((prev) => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  }

  function removeRotationRow(index: number) {
    setRotationList((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleToggleJoin(boss: Boss) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: existing } = await supabase.from("boss_participants").select("id").eq("boss_id", boss.id).eq("user_id", user.id).single();
    if (existing) {
      await supabase.from("boss_participants").delete().eq("id", existing.id);
      loadAll();
    }
  }

  async function handleJoinAll() {
    if (!joinAllGroup || !joinAllCharId) return;
    setJoiningAll(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setJoiningAll(false); return; }

    const groupBosses = bosses.filter((b) => b.rotation_group === joinAllGroup);

    for (const boss of groupBosses) {
      const { data: existing } = await supabase.from("boss_participants").select("id").eq("boss_id", boss.id).eq("user_id", user.id).single();
      if (existing) continue;
      await supabase.from("boss_participants").insert({
        boss_id: boss.id,
        user_id: user.id,
        character_id: joinAllCharId,
      });
    }

    const firstBoss = groupBosses[0];
    if (firstBoss?.discord_message_id) {
      const allRotBosses = bosses.filter((b) => b.rotation_group === joinAllGroup);
      const bossWithParts = await Promise.all(
        allRotBosses.map(async (b) => {
          const { data: parts } = await supabase.from("boss_participants").select("character_id").eq("boss_id", b.id);
          const pIds = [...new Set((parts ?? []).map((p: any) => p.character_id).filter(Boolean))];
          let pNames: { name: string; vocation: string }[] = [];
          if (pIds.length > 0) {
            const { data: chars } = await supabase.from("characters").select("name, vocation").in("id", pIds);
            pNames = (chars ?? []).map((c: any) => ({ name: c.name, vocation: c.vocation }));
          }
          return { name: b.name, bossId: b.id, weekday: b.weekday, spawnInterval: b.spawn_interval, minLevel: 0, maxParticipants: b.max_participants || 0, participants: pNames };
        })
      );
      notifyBossRotationUpdated({ messageId: firstBoss.discord_message_id, bosses: bossWithParts });
    }

    setJoinAllModal(false);
    setJoinAllGroup(null);
    setJoinAllCharId("");
    setJoiningAll(false);
    loadAll();
  }

  async function handleDeleteRotation(groupId: string) {
    await supabase.from("bosses").delete().eq("rotation_group", groupId);
    loadAll();
  }

  async function handleDelete(bossId: string) {
    await supabase.from("bosses").delete().eq("id", bossId);
    loadAll();
  }

  const isAdmin = myRole === "LEADER" || myRole === "VICE";

  if (loading) return <div className="space-y-6 animate-pulse"><div className="h-8 w-48 bg-surface rounded" /><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-surface rounded-xl" />)}</div></div>;

  const grouped = WEEKDAYS.map((day, i) => ({ day, idx: i, bosses: bosses.filter((b) => b.weekday === i) }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bosses</h1>
          <p className="text-muted mt-1">Rotação semanal de bosses da guilda</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setRotationList([]); setRotationModalOpen(true); }} variant="outline" size="sm">
            <Plus size={16} /> Criar Rotação
          </Button>
          <Button onClick={() => { setFormError(""); setModalOpen(true); }}>
            <Plus size={16} /> Adicionar Boss
          </Button>
        </div>
      </div>

      {grouped.map(({ day, idx, bosses: dayBosses }) => (
        <Card key={idx}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              <CardTitle>{day}</CardTitle>
              {dayBosses.length === 0 && <span className="text-sm text-muted">— Nenhum boss</span>}
            </div>
          </CardHeader>
          {dayBosses.length > 0 && (() => {
            const solo = dayBosses.filter((b) => !b.rotation_group);
            const groups = new Map<string, Boss[]>();
            dayBosses.filter((b) => b.rotation_group).forEach((b) => {
              const g = groups.get(b.rotation_group!) || [];
              g.push(b);
              groups.set(b.rotation_group!, g);
            });

            return (
              <div className="space-y-2">
                {[...groups.entries()].map(([groupId, groupBosses]) => (
                  <div key={groupId} className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="warning" className="text-xs">Rotação · {groupBosses.length} bosses</Badge>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setJoinAllGroup(groupId); setJoinAllCharId(""); setJoinAllModal(true); }}
                          className="border border-border hover:bg-surface-hover text-foreground px-3 py-1.5 text-xs rounded-md cursor-pointer flex items-center gap-1"
                        >
                          <Users size={12} /> Participar de todos
                        </button>
                        {isAdmin && (
                          <button onClick={() => handleDeleteRotation(groupId)} className="p-1 rounded hover:bg-red-500/10 cursor-pointer">
                            <Trash2 size={14} className="text-red-400" />
                          </button>
                        )}
                      </div>
                    </div>
                    {groupBosses.map((boss) => (
                      <div key={boss.id} className="flex items-center justify-between p-2 pl-3 border-l-2 border-primary/20 ml-1">
                        <div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => router.push(`/dashboard/bosses/${boss.id}`)} className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">{boss.name}</button>
                            {boss.is_official && <Badge variant="danger" className="text-xs">Oficial</Badge>}
                            <Badge variant="info" className="text-xs">a cada {boss.spawn_interval}d</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => router.push(`/dashboard/bosses/${boss.id}`)} className="text-xs h-7 px-2 hover:bg-surface-hover rounded cursor-pointer">Abrir</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
                {solo.map((boss) => (
                  <div key={boss.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-hover">
                    <div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => router.push(`/dashboard/bosses/${boss.id}`)} className="font-medium hover:text-primary transition-colors cursor-pointer">{boss.name}</button>
                        {boss.is_official && <Badge variant="danger">Oficial</Badge>}
                        <Badge variant="info">a cada {boss.spawn_interval}d</Badge>
                      </div>
                      {boss.notes && <p className="text-xs text-muted mt-1">{boss.notes}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => router.push(`/dashboard/bosses/${boss.id}`)} className="border border-border hover:bg-surface-hover text-foreground px-3 py-1.5 text-sm rounded-md cursor-pointer">Participar</button>
                      <button onClick={() => router.push(`/dashboard/bosses/${boss.id}`)} className="hover:bg-surface-hover text-foreground px-3 py-1.5 text-sm rounded-md cursor-pointer"><ExternalLink size={14} /></button>
                      {(isAdmin || boss.created_by === "(you)") && (
                        <button onClick={() => handleDelete(boss.id)} className="p-1 rounded hover:bg-red-500/10 cursor-pointer"><X size={14} className="text-red-400" /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </Card>
      ))}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Adicionar Boss">
        <div className="space-y-4">
          <Input label="Nome do Boss" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ferumbras" />
          <Select label="Dia da Semana" value={formWeekday} onChange={(e) => setFormWeekday(e.target.value)} options={WEEKDAYS.map((d, i) => ({ value: String(i), label: d }))} />
          <Input label="Intervalo de spawn (dias)" type="number" value={formInterval} onChange={(e) => setFormInterval(e.target.value)} placeholder="15" />
          <Input label="Máximo de participantes" type="number" value={formMaxPlayers} onChange={(e) => setFormMaxPlayers(e.target.value)} placeholder="0 = sem limite" />
          <Input label="Observações" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Opcional" />
          {isAdmin && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formOfficial} onChange={(e) => setFormOfficial(e.target.checked)} className="rounded border-border bg-surface checked:bg-primary" />
              <span className="text-sm flex items-center gap-1"><Shield size={14} /> Boss Oficial (organizado pela liderança)</span>
            </label>
          )}
          {formError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">{formError}</div>}
          <Button onClick={handleCreate} className="w-full" disabled={saving}>{saving ? "Criando..." : "Adicionar Boss"}</Button>
        </div>
      </Modal>

      <Modal open={rotationModalOpen} onClose={() => setRotationModalOpen(false)} title="Criar Rotação de Bosses" className="max-w-lg">
        <div className="space-y-4">
          <p className="text-sm text-muted">Adicione os bosses da rotação:</p>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {rotationList.map((r, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-surface-hover">
                <div className="flex-1 space-y-2">
                  <Input value={r.name} onChange={(e) => updateRotationRow(i, "name", e.target.value)} placeholder="Nome do boss" />
                  <div className="grid grid-cols-4 gap-2">
                    <Select value={r.weekday} onChange={(e) => updateRotationRow(i, "weekday", e.target.value)} options={WEEKDAYS.map((d, j) => ({ value: String(j), label: d }))} />
                    <Input type="number" value={r.interval} onChange={(e) => updateRotationRow(i, "interval", e.target.value)} placeholder="Dias" />
                    <Input type="number" value={r.minLevel} onChange={(e) => updateRotationRow(i, "minLevel", e.target.value)} placeholder="Nível mín." className="bg-amber-500/10 placeholder:text-amber-400/60" />
                    <Input type="number" value={r.maxPlayers} onChange={(e) => updateRotationRow(i, "maxPlayers", e.target.value)} placeholder="Vagas" />
                  </div>
                </div>
                <button onClick={() => removeRotationRow(i)} className="p-1.5 rounded hover:bg-red-500/10 cursor-pointer mt-1">
                  <X size={14} className="text-red-400" />
                </button>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full" onClick={addRotationRow}>
            <Plus size={14} className="mr-1" /> Adicionar Boss
          </Button>
          {rotationList.filter((r) => r.name.trim()).length > 0 && (
            <p className="text-xs text-muted text-center">{rotationList.filter((r) => r.name.trim()).length} boss(es) serão criados</p>
          )}
          <Button onClick={handleCreateRotation} className="w-full" disabled={savingRotation || rotationList.filter((r) => r.name.trim()).length === 0}>
            {savingRotation ? "Criando..." : `Criar ${rotationList.filter((r) => r.name.trim()).length || ""} Bosses`}
          </Button>
        </div>
      </Modal>

      <Modal open={joinAllModal} onClose={() => { setJoinAllModal(false); setJoinAllGroup(null); }} title="Participar de toda a rotação">
        <div className="space-y-4">
          <p className="text-sm text-muted">Escolha um personagem para participar de todos os bosses desta rotação:</p>
          {myChars.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted mb-3">Você não tem personagens cadastrados.</p>
              <button onClick={() => router.push("/dashboard/profile")} className="border border-border hover:bg-surface-hover text-foreground px-4 py-2 text-sm rounded-md cursor-pointer w-full">Cadastrar Personagem</button>
            </div>
          ) : (
            <>
              {myChars.map((char) => (
                <button
                  key={char.id}
                  onClick={() => setJoinAllCharId(char.id)}
                  className={`w-full justify-start px-4 py-2 text-sm rounded-md cursor-pointer flex items-center ${joinAllCharId === char.id ? "bg-primary hover:bg-primary-hover text-primary-foreground" : "border border-border hover:bg-surface-hover text-foreground"}`}
                >
                  <span>{char.name}</span>
                  <span className="text-muted text-xs ml-2">{char.vocation}</span>
                </button>
              ))}
              <button onClick={handleJoinAll} className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 text-sm rounded-md cursor-pointer w-full" disabled={!joinAllCharId || joiningAll}>
                {joiningAll ? "Inscrevendo..." : "Participar de todos"}
              </button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
