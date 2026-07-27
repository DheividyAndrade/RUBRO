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
import { Skull, Plus, Calendar, Shield, X, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notifyBossCreated } from "@/lib/discord";

interface Boss {
  id: string;
  name: string;
  weekday: number;
  spawn_interval: number;
  is_official: boolean;
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
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const supabase = createClient();

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: bossData }, { data: profile }] = await Promise.all([
      supabase.from("bosses").select("*").order("weekday").order("name"),
      supabase.from("profiles").select("role").eq("id", user.id).single(),
    ]);

    setBosses(bossData ?? []);
    setMyRole(profile?.role ?? "MEMBER");
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
      notes: formNotes || null,
    }).select("id").single();

    if (error) { setFormError(error.message); setSaving(false); return; }

    if (newBoss) {
      notifyBossCreated({
        name: formName,
        bossId: newBoss.id,
        weekday: Number(formWeekday),
        spawnInterval: Number(formInterval) || 15,
        isOfficial: isAdmin && formOfficial,
      });
    }

    setModalOpen(false);
    setFormName("");
    setFormWeekday("0");
    setFormInterval("15");
    setFormNotes("");
    setFormOfficial(false);
    setSaving(false);
    loadAll();
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
        <Button onClick={() => { setFormError(""); setModalOpen(true); }}>
          <Plus size={16} /> Adicionar Boss
        </Button>
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
          {dayBosses.length > 0 && (
            <div className="space-y-2">
              {dayBosses.map((boss) => (
                <div key={boss.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-hover">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/bosses/${boss.id}`} className="font-medium hover:text-primary transition-colors">{boss.name}</Link>
                      {boss.is_official && <Badge variant="danger">Oficial</Badge>}
                      <Badge variant="info">a cada {boss.spawn_interval}d</Badge>
                    </div>
                    {boss.notes && <p className="text-xs text-muted mt-1">{boss.notes}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href={`/dashboard/bosses/${boss.id}`}>
                      <Button size="sm" variant="outline">Participar</Button>
                    </Link>
                    <Link href={`/dashboard/bosses/${boss.id}`}>
                      <Button size="sm" variant="ghost"><ExternalLink size={14} /></Button>
                    </Link>
                    {(isAdmin || boss.created_by === "(you)") && (
                      <button onClick={() => handleDelete(boss.id)} className="p-1 rounded hover:bg-red-500/10 cursor-pointer"><X size={14} className="text-red-400" /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Adicionar Boss">
        <div className="space-y-4">
          <Input label="Nome do Boss" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ferumbras" />
          <Select label="Dia da Semana" value={formWeekday} onChange={(e) => setFormWeekday(e.target.value)} options={WEEKDAYS.map((d, i) => ({ value: String(i), label: d }))} />
          <Input label="Intervalo de spawn (dias)" type="number" value={formInterval} onChange={(e) => setFormInterval(e.target.value)} placeholder="15" />
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
    </div>
  );
}
