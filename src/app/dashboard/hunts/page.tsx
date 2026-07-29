"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { TIBIA_HUNTS } from "@/lib/tibia-hunts";
import { notifyHuntCreated } from "@/lib/discord";
import { VOCATIONS, type Vocation, sharedExpRange, HUNT_STATUS } from "@/lib/utils";
import { Swords, Plus, Clock, Shield, Users, User, Lock, Trash2 } from "lucide-react";
import Link from "next/link";

interface Character {
  id: string;
  name: string;
  vocation: Vocation;
  level: number;
}

interface Hunt {
  id: string;
  name: string;
  scheduled_at: string;
  end_time: string | null;
  hunt_type: "solo" | "group";
  min_level: number;
  slots: { EK: number; RP: number; MS: number; ED: number; MK: number };
  status: string;
  created_by: string;
  character_id: string | null;
  notes: string | null;
  creator_char?: { name: string; level: number; vocation: Vocation } | null;
  participants: { count: number }[];
}

const DEFAULT_SLOTS: Record<Vocation, number> = { EK: 1, RP: 2, MS: 1, ED: 1, MK: 1 };

export default function HuntsPage() {
  const [hunts, setHunts] = useState<Hunt[]>([]);
  const [myChars, setMyChars] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [myRole, setMyRole] = useState<string>("MEMBER");

  const [formCharId, setFormCharId] = useState("");
  const [formHuntName, setFormHuntName] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("");
  const [formEndTime, setFormEndTime] = useState("");
  const [formHuntType, setFormHuntType] = useState<"solo" | "group">("group");
  const [formSlots, setFormSlots] = useState<Record<Vocation, number>>({ ...DEFAULT_SLOTS });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [filter, setFilter] = useState<"all" | "open" | "full" | "completed">("all");
  const [filterType, setFilterType] = useState<"all" | "solo" | "group">("all");

  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    setMyRole(profile?.role ?? "MEMBER");

    const [{ data: huntsData }, { data: chars }] = await Promise.all([
      supabase.from("hunts").select("*").in("status", ["open", "full"]).order("scheduled_at", { ascending: true }),
      supabase.from("characters").select("id,name,vocation,level").eq("user_id", user.id),
    ]);

    if (huntsData && huntsData.length > 0) {
      const huntIds = huntsData.map((h: any) => h.id);
      const charIds = [...new Set(huntsData.map((h: any) => h.character_id).filter(Boolean) as string[])];

      const [{ data: counts }, { data: charData }] = await Promise.all([
        supabase.from("hunt_participants").select("hunt_id").in("hunt_id", huntIds),
        charIds.length > 0 ? supabase.from("characters").select("id, name, level, vocation").in("id", charIds) : Promise.resolve({ data: [] }),
      ]);

      const countMap = new Map<string, number>();
      (counts ?? []).forEach((c: any) => {
        countMap.set(c.hunt_id, (countMap.get(c.hunt_id) || 0) + 1);
      });

      const charMap = new Map((charData ?? []).map((c: any) => [c.id, c]));

      const enriched = huntsData.map((h: any) => ({
        ...h,
        participants: [{ count: countMap.get(h.id) || 0 }],
        creator_char: charMap.get(h.character_id) ?? null,
      }));

      setHunts(enriched);
    } else {
      setHunts([]);
    }

    setMyChars(chars ?? []);
    setLoading(false);
  }

  const isAdmin = myRole === "LEADER" || myRole === "VICE";

  async function handleDelete(huntId: string) {
    if (!confirm("Excluir esta hunt permanentemente?")) return;
    await supabase.from("hunts").delete().eq("id", huntId);
    loadData();
  }

  async function handleCreate() {
    if (!formCharId) { setFormError("Selecione um personagem."); return; }
    if (!formHuntName) { setFormError("Nome da hunt é obrigatório."); return; }
    if (!formDate || !formStartTime) { setFormError("Data e horário são obrigatórios."); return; }

    setSaving(true);
    setFormError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const char = myChars.find((c) => c.id === formCharId);
    const scheduledAt = new Date(`${formDate}T${formStartTime}:00`).toISOString();
    const endAt = formEndTime ? new Date(`${formDate}T${formEndTime}:00`).toISOString() : null;

    const payload: any = {
      created_by: user.id,
      name: formHuntName,
      scheduled_at: scheduledAt,
      end_time: endAt,
      hunt_type: formHuntType,
      character_id: char?.id ?? null,
      slots: formHuntType === "solo" ? { EK: 0, RP: 0, MS: 0, ED: 0, MK: 0 } : formSlots,
    };

    const { data: newHunt, error } = await supabase
      .from("hunts")
      .insert(payload)
      .select("id")
      .single();

    if (error) { setFormError(error.message); setSaving(false); return; }

    if (char && newHunt) {
      await supabase.from("hunt_participants").insert({
        hunt_id: newHunt.id,
        user_id: user.id,
        character_id: char.id,
        vocation_slot: char.vocation,
        confirmed: true,
        is_waiting: false,
      });

      notifyHuntCreated({
        name: formHuntName,
        huntId: newHunt.id,
        scheduledAt: scheduledAt,
        endTime: endAt,
        huntType: formHuntType,
        creatorName: char.name,
        creatorVocation: char.vocation,
        creatorLevel: char.level,
        slots: formHuntType === "solo" ? {} : formSlots,
      });
    }

    setModalOpen(false);
    resetForm();
    setSaving(false);
    loadData();
  }

  function resetForm() {
    setFormCharId("");
    setFormHuntName("");
    setFormDate("");
    setFormStartTime("");
    setFormEndTime("");
    setFormHuntType("group");
    setFormSlots({ ...DEFAULT_SLOTS });
    setFormError("");
  }

  function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  }

  function getSelectedChar() {
    return myChars.find((c) => c.id === formCharId);
  }

  const selectedChar = getSelectedChar();
  const expRange = selectedChar ? sharedExpRange(selectedChar.level) : null;

  const statusVariant = (s: string) => {
    if (s === "open") return "success";
    if (s === "full") return "warning";
    if (s === "completed") return "info";
    return "danger";
  };

  if (loading) {
    return <div className="space-y-6 animate-pulse"><div className="h-8 w-48 bg-surface rounded" /><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-40 bg-surface rounded-xl" />)}</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hunts</h1>
          <p className="text-muted mt-1">Crie claims de hunt e monte sua PT</p>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true); }}>
          <Plus size={16} /> Criar Hunt
        </Button>
      </div>

      {hunts.length === 0 ? (
        <Card><p className="text-sm text-muted text-center py-8">Nenhuma hunt agendada.</p></Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all" as const, label: "Todas" },
              { key: "open" as const, label: "Abertas" },
              { key: "full" as const, label: "Completas" },
              { key: "completed" as const, label: "Encerradas" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  filter === f.key ? "bg-primary/20 text-primary" : "bg-surface-hover text-muted hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
            <span className="mx-1 text-border">|</span>
            {[
              { key: "all" as const, label: "Todos os tipos" },
              { key: "group" as const, label: "PT Aberta" },
              { key: "solo" as const, label: "Solo" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterType(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  filterType === f.key ? "bg-primary/20 text-primary" : "bg-surface-hover text-muted hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hunts
            .filter((h) => filter === "all" || h.status === filter)
            .filter((h) => filterType === "all" || h.hunt_type === filterType)
            .map((hunt) => {
            const slots = (hunt.slots || DEFAULT_SLOTS) as Record<Vocation, number>;
            const creatorLevel = (hunt as any).creator_char?.level;
            const range = creatorLevel ? sharedExpRange(creatorLevel) : null;

            return (
              <Link key={hunt.id} href={`/dashboard/hunts/${hunt.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{hunt.name}</h3>
                        {hunt.hunt_type === "solo" && (
                          <Badge variant="default"><Lock size={12} className="inline mr-1" />Solo</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-sm text-muted">
                        <span className="flex items-center gap-1"><Clock size={14} />{formatDateTime(hunt.scheduled_at)}</span>
                        {hunt.end_time && <span>até {formatDateTime(hunt.end_time)}</span>}
                      </div>
                      {(hunt as any).creator_char?.name && (
                        <p className="text-xs text-muted mt-1">
                          <User size={12} className="inline mr-1" />
                          {(hunt as any).creator_char.name} ({VOCATIONS[(hunt as any).creator_char.vocation as Vocation]?.short}) Level {(hunt as any).creator_char.level}
                        </p>
                      )}
                      {range && hunt.hunt_type === "group" && (
                        <p className="text-xs text-muted mt-1">
                          <Shield size={12} className="inline mr-1" />
                          Shared: {range.min} – {range.max}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant(hunt.status)}>
                        {HUNT_STATUS[hunt.status as keyof typeof HUNT_STATUS] ?? hunt.status}
                      </Badge>
                      {isAdmin && (
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(hunt.id); }} className="p-1 rounded hover:bg-red-500/10 cursor-pointer" title="Excluir">
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>

                  {hunt.hunt_type === "group" && (
                    <div className="flex items-center gap-2 mt-3 text-xs flex-wrap">
                      <span className="text-muted">
                        {(hunt as any).participants?.[0]?.count ?? 0} jogadores ·{" "}
                      </span>
                      {(Object.keys(VOCATIONS) as Vocation[]).map((voc) => {
                        const slotCount = slots[voc] ?? 0;
                        if (slotCount === 0) return null;
                        return (
                          <span key={voc} className="flex items-center gap-1">
                            <span className={VOCATIONS[voc].color}>{VOCATIONS[voc].short}</span>
                            <span className="text-muted">{slotCount}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Criar Claim de Hunt" className="max-w-lg">
        <div className="space-y-4">
          <Select
            label="Personagem"
            value={formCharId}
            onChange={(e) => setFormCharId(e.target.value)}
            options={[
              { value: "", label: "Selecione..." },
              ...myChars.map((c) => ({
                value: c.id,
                label: `${c.name} (${VOCATIONS[c.vocation].short}) Level ${c.level}`,
              })),
            ]}
          />

          {expRange && (
            <div className="p-3 rounded-lg bg-surface-hover text-sm">
              <span className="text-muted">Shared Experience: </span>
              <span className="font-medium text-primary">{expRange.min} – {expRange.max}</span>
            </div>
          )}

          <SearchableSelect label="Hunt" value={formHuntName} onChange={setFormHuntName} options={TIBIA_HUNTS} placeholder="Buscar hunt..." />

          <div className="grid grid-cols-2 gap-3">
            <Input label="Data" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
            <Select
              label="Tipo"
              value={formHuntType}
              onChange={(e) => setFormHuntType(e.target.value as "solo" | "group")}
              options={[
                { value: "group", label: "PT Aberta" },
                { value: "solo", label: "Hunt Solo" },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Horário Início" type="time" value={formStartTime} onChange={(e) => setFormStartTime(e.target.value)} />
            <Input label="Horário Fim" type="time" value={formEndTime} onChange={(e) => setFormEndTime(e.target.value)} />
          </div>

          {formHuntType === "group" && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Vagas por Vocação</label>
              <div className="grid grid-cols-5 gap-2">
                {(Object.keys(VOCATIONS) as Vocation[]).map((voc) => (
                  <div key={voc}>
                    <label className={`block text-xs mb-1 ${VOCATIONS[voc].color}`}>{VOCATIONS[voc].short}</label>
                    <input
                      type="number" min="0" max="20"
                      value={formSlots[voc]}
                      onChange={(e) => setFormSlots((prev) => ({ ...prev, [voc]: Number(e.target.value) || 0 }))}
                      className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-foreground text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {formError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">{formError}</div>
          )}

          <Button onClick={handleCreate} className="w-full" disabled={saving}>
            {saving ? "Criando..." : "Criar Hunt"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
