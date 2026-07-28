"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { VOCATIONS, type Vocation, sharedExpRange, HUNT_STATUS } from "@/lib/utils";
import { notifyAllHuntParticipants } from "@/lib/notifications";
import { notifyHuntCompleted, notifyHuntCancelled, notifyHuntJoined } from "@/lib/discord";
import { Clock, Shield, User, Check, X, ArrowLeft, Lock, AlertCircle, Coins, Plus, Trash2 } from "lucide-react";

interface Hunt {
  id: string;
  name: string;
  scheduled_at: string;
  end_time: string | null;
  hunt_type: "solo" | "group";
  slots: Record<Vocation, number>;
  status: string;
  notes: string | null;
  created_by: string;
  character_id: string | null;
}

interface Participant {
  id: string;
  user_id: string;
  character_id: string;
  vocation_slot: Vocation;
  confirmed: boolean;
  is_waiting: boolean;
  character: { name: string; level: number; vocation: Vocation } | null;
  profile: { display_name: string; role: string } | null;
}

const DEFAULT_SLOTS: Record<Vocation, number> = { EK: 1, RP: 2, MS: 1, ED: 1, MK: 1 };

export default function HuntDetailPage() {
  const params = useParams();
  const router = useRouter();
  const huntId = params.id as string;

  const [hunt, setHunt] = useState<Hunt | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [myChars, setMyChars] = useState<{ id: string; name: string; vocation: Vocation; level: number }[]>([]);
  const [myUserId, setMyUserId] = useState<string>("");
  const [myRole, setMyRole] = useState<string>("MEMBER");
  const [loading, setLoading] = useState(true);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [selectedCharId, setSelectedCharId] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinValidation, setJoinValidation] = useState<{ ok: boolean; msg: string } | null>(null);
  const [lootItems, setLootItems] = useState<any[]>([]);
  const [lootModalOpen, setLootModalOpen] = useState(false);
  const [lootSplitIds, setLootSplitIds] = useState<string[]>([]);
  const [lootAmounts, setLootAmounts] = useState<Record<string, string>>({});
  const [lootError, setLootError] = useState("");
  const [savingLoot, setSavingLoot] = useState(false);

  const supabase = createClient();

  useEffect(() => { loadHunt(); }, [huntId]);

  async function loadHunt() {
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) return;
    setMyUserId(user.id);

    const [{ data: huntData }, { data: parts }, { data: chars }, { data: profile }] = await Promise.all([
      supabase.from("hunts").select("*").eq("id", huntId).single(),
      supabase.from("hunt_participants").select("*").eq("hunt_id", huntId).order("is_waiting"),
      supabase.from("characters").select("id,name,vocation,level").eq("user_id", user.id),
      supabase.from("profiles").select("role").eq("id", user.id).single(),
    ]);

    const characterIds = [...new Set((parts ?? []).map((p: any) => p.character_id).filter(Boolean))];
    const { data: charData } = characterIds.length > 0
      ? await supabase.from("characters").select("id, name, level, vocation").in("id", characterIds)
      : { data: [] };
    const charMap = new Map((charData ?? []).map((c: any) => [c.id, c]));

    const mapped = (parts ?? []).map((p: any) => ({
      ...p,
      character: charMap.get(p.character_id) ?? null,
    }));

    setHunt(huntData);
    setParticipants(mapped);
    setMyChars(chars ?? []);
    setMyRole(profile?.role ?? "MEMBER");
    setLoading(false);

    const { data: loot } = await supabase.from("loot_history").select("*").eq("hunt_id", huntId).order("created_at", { ascending: false });
    setLootItems(loot ?? []);
  }

  function validateJoin(charId: string) {
    const char = myChars.find((c) => c.id === charId);
    if (!char) return;
    if (!hunt) return;
    if (hunt.hunt_type === "solo") {
      setJoinValidation({ ok: false, msg: "Esta hunt é Solo — apenas o criador pode participar." });
      return;
    }
    if (hunt.status !== "open" && hunt.status !== "full") {
      setJoinValidation({ ok: false, msg: "Esta hunt não está mais aberta." });
      return;
    }
    const slots = (hunt.slots || DEFAULT_SLOTS) as Record<Vocation, number>;
    const slotMax = slots[char.vocation] ?? 0;
    if (slotMax === 0) {
      setJoinValidation({ ok: false, msg: "Não existem vagas para sua vocação." });
      return;
    }
    const currentInSlot = participants.filter((p) => p.vocation_slot === char.vocation && !p.is_waiting).length;
    if (currentInSlot >= slotMax) {
      setJoinValidation({ ok: false, msg: "Não existem vagas para sua vocação." });
      return;
    }
    const creatorChar = participants.find((p) => p.user_id === hunt.created_by)?.character;
    const creatorLevel = creatorChar?.level ?? char.level;
    const range = sharedExpRange(creatorLevel);
    if (char.level < range.min || char.level > range.max) {
      setJoinValidation({ ok: false, msg: `Seu nível (${char.level}) não está na faixa de Shared Experience (${range.min}–${range.max}).` });
      return;
    }
    setJoinValidation({ ok: true, msg: "Tudo certo! Você será adicionado à PT." });
  }

  async function handleJoin() {
    if (!selectedCharId) { setJoinError("Selecione um personagem."); return; }
    const char = myChars.find((c) => c.id === selectedCharId);
    if (!char) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: freshHunt } = await supabase.from("hunts").select("status").eq("id", huntId).single();
    if (!freshHunt || (freshHunt.status !== "open" && freshHunt.status !== "full")) {
      setJoinError("Esta hunt não está mais aberta.");
      return;
    }

    const { error } = await supabase.from("hunt_participants").insert({
      hunt_id: huntId, user_id: user.id, character_id: char.id, vocation_slot: char.vocation, is_waiting: false,
    });
    if (error) {
      if (error.code === "23505") setJoinError("Você já está nesta hunt.");
      else setJoinError(error.message);
      return;
    }

    if (hunt && hunt.hunt_type === "group") {
      const slots = (hunt.slots || { EK: 0, RP: 0, MS: 0, ED: 0, MK: 0 }) as Record<string, number>;
      const filledSlots: Record<string, number> = {};
      participants.forEach((p) => {
        if (!p.is_waiting) {
          filledSlots[p.vocation_slot] = (filledSlots[p.vocation_slot] ?? 0) + 1;
        }
      });
      filledSlots[char.vocation] = (filledSlots[char.vocation] ?? 0) + 1;

      notifyHuntJoined({
        huntName: hunt.name,
        huntId: huntId,
        characterName: char.name,
        characterVocation: char.vocation,
        characterLevel: char.level,
        slots,
        filledSlots,
      });
    }

    setJoinModalOpen(false);
    setSelectedCharId("");
    setJoinValidation(null);
    setJoinError("");
    await loadHunt();
  }

  async function handleLeave(participantId: string) {
    await supabase.from("hunt_participants").delete().eq("id", participantId);
    loadHunt();
  }

  async function handleConfirm(participantId: string, value: boolean) {
    await supabase.from("hunt_participants").update({ confirmed: value }).eq("id", participantId);
    loadHunt();
  }

  async function handleComplete() {
    await supabase.from("hunts").update({ status: "completed" }).eq("id", huntId);
    notifyAllHuntParticipants({ huntId, title: "Hunt encerrada", message: `${hunt?.name} foi concluída.`, link: `/dashboard/hunts/${huntId}` });
    if (hunt) {
      const partList = participants
        .filter((p) => !p.is_waiting)
        .map((p) => ({
          name: p.character?.name ?? "?",
          vocation: p.character?.vocation ?? "?",
        }));
      notifyHuntCompleted({ name: hunt.name, huntId: huntId, participants: partList });
    }
    await loadHunt();
    setLootError(""); setLootSplitIds([]); setLootAmounts({}); setLootModalOpen(true);
  }

  async function handleCancel() {
    await supabase.from("hunts").update({ status: "cancelled" }).eq("id", huntId);
    notifyAllHuntParticipants({ huntId, title: "Hunt cancelada", message: `${hunt?.name} foi cancelada.`, link: `/dashboard/hunts/${huntId}` });
    if (hunt) notifyHuntCancelled({ name: hunt.name, huntId: huntId });
    await loadHunt();
    setLootError(""); setLootSplitIds([]); setLootAmounts({}); setLootModalOpen(true);
  }

  async function handleDeleteHunt() {
    if (!confirm("Tem certeza que deseja EXCLUIR esta hunt permanentemente?")) return;
    await supabase.from("hunts").delete().eq("id", huntId);
    router.push("/dashboard/hunts");
  }

  async function handleSaveLoot() {
    setSavingLoot(true);
    setLootError("");

    let splits: { user_id: string; amount: number }[] = [];
    let totalValue = 0;

    if (hunt?.hunt_type === "solo") {
      const soloParticipant = participants.find((p) => !p.is_waiting);
      if (!soloParticipant) { setLootError("Nenhum participante na hunt."); setSavingLoot(false); return; }
      const amount = Number(lootAmounts[soloParticipant.user_id] || 0);
      if (amount <= 0) { setLootError("Informe o valor do loot."); setSavingLoot(false); return; }
      splits = [{ user_id: soloParticipant.user_id, amount }];
      totalValue = amount;
    } else {
      if (lootSplitIds.length === 0) { setLootError("Selecione pelo menos um jogador."); setSavingLoot(false); return; }
      splits = lootSplitIds.map((uid) => ({
        user_id: uid,
        amount: Number(lootAmounts[uid]) || 0,
      }));
      totalValue = splits.reduce((sum, s) => sum + s.amount, 0);
      if (totalValue <= 0) { setLootError("Informe os valores para cada jogador."); setSavingLoot(false); return; }
    }

    const { error } = await supabase.from("loot_history").insert({
      hunt_id: huntId,
      item_name: "Divisão de Loot",
      value: totalValue,
      split_among: splits,
    });

    if (error) { setLootError(error.message); setSavingLoot(false); return; }

    if (hunt) {
      const partList = participants
        .filter((p) => !p.is_waiting)
        .map((p) => ({
          name: p.character?.name ?? "?",
          vocation: p.character?.vocation ?? "?",
        }));
      const splitList = lootSplitIds
        .map((uid) => {
          const p = participants.find((pt) => pt.user_id === uid);
          return {
            name: p?.character?.name ?? "?",
            amount: Number(lootAmounts[uid]) || 0,
          };
        })
        .filter((s) => s.amount > 0);
      notifyHuntCompleted({
        name: hunt.name,
        huntId: huntId,
        participants: partList,
        lootTotal: totalValue,
        lootSplits: splitList,
      });
    }

    setLootModalOpen(false);
    setLootSplitIds([]);
    setLootAmounts({});
    setSavingLoot(false);
    const { data: loot } = await supabase.from("loot_history").select("*").eq("hunt_id", huntId).order("created_at", { ascending: false });
    setLootItems(loot ?? []);
  }

  function toggleSplitId(id: string) {
    setLootSplitIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function setAmount(userId: string, value: string) {
    setLootAmounts((prev) => ({ ...prev, [userId]: value }));
  }

  const isAdmin = myRole === "LEADER" || myRole === "VICE";
  const isCreator = hunt?.created_by === myUserId;
  const canManage = isAdmin || isCreator;

  if (loading || !hunt) {
    return <div className="space-y-6 animate-pulse"><div className="h-8 w-48 bg-surface rounded" /><div className="h-64 bg-surface rounded-xl" /></div>;
  }

  const slots = (hunt.slots || DEFAULT_SLOTS) as Record<Vocation, number>;
  const creatorParticipant = participants.find((p) => p.user_id === hunt.created_by);
  const creatorLevel = creatorParticipant?.character?.level ?? 0;
  const range = creatorLevel > 0 ? sharedExpRange(creatorLevel) : null;

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted hover:text-foreground cursor-pointer">
        <ArrowLeft size={16} /> Voltar
      </button>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{hunt.name}</h1>
            {hunt.hunt_type === "solo" && <Badge variant="default"><Lock size={12} className="inline mr-1" />Solo</Badge>}
            <Badge variant={hunt.status === "open" ? "success" : hunt.status === "full" ? "warning" : "danger"}>
              {HUNT_STATUS[hunt.status as keyof typeof HUNT_STATUS] ?? hunt.status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted">
            <span className="flex items-center gap-1"><Clock size={14} />{new Date(hunt.scheduled_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
            {hunt.end_time && <span>até {new Date(hunt.end_time).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>}
          </div>
          {range && hunt.hunt_type === "group" && (
            <p className="text-sm text-muted mt-1"><Shield size={12} className="inline mr-1" />Shared: {range.min} – {range.max}</p>
          )}
        </div>

        <div className="flex gap-2">
          {hunt.status === "open" && hunt.hunt_type === "group" && !participants.some((p) => p.user_id === myUserId) && (
            <Button onClick={() => { setSelectedCharId(""); setJoinValidation(null); setJoinError(""); setJoinModalOpen(true); }}>
              Entrar na PT
            </Button>
          )}
          {canManage && (hunt.status === "open" || hunt.status === "full") && (
            <>
              <Button variant="outline" size="sm" onClick={handleComplete}>Encerrar</Button>
              <Button variant="ghost" size="sm" onClick={handleCancel}>Cancelar</Button>
            </>
          )}
          {canManage && hunt.status === "completed" && (
            <Button size="sm" onClick={() => { setLootError(""); setLootSplitIds([]); setLootAmounts({}); setLootModalOpen(true); }}>
              <Coins size={14} className="mr-1" /> Registrar Loot
            </Button>
          )}
          {canManage && (
            <Button variant="ghost" size="sm" onClick={handleDeleteHunt} title="Excluir permanentemente">
              <Trash2 size={16} className="text-red-400" />
            </Button>
          )}
        </div>
      </div>

      {hunt.hunt_type === "group" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.keys(VOCATIONS) as Vocation[]).map((voc) => {
            const inSlot = participants.filter((p) => p.vocation_slot === voc && !p.is_waiting);
            const maxSlot = slots[voc] ?? 0;
            if (maxSlot === 0) return null;
            return (
              <Card key={voc} className={inSlot.length >= maxSlot ? "border-success/30" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-lg ${VOCATIONS[voc].color}`}>{VOCATIONS[voc].short}</span>
                      <span className="text-sm text-muted">({inSlot.length}/{maxSlot})</span>
                    </div>
                    {inSlot.length >= maxSlot && <Check size={18} className="text-success" />}
                  </div>
                </CardHeader>
                {inSlot.length === 0 ? (
                  <p className="text-sm text-muted px-2 pb-4">Vaga disponível</p>
                ) : (
                  <div className="space-y-1 px-2 pb-4">
                    {inSlot.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-surface-hover">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-muted" />
                          <div>
                            <p className="text-sm font-medium">{p.character?.name ?? "..."}</p>
                            <p className="text-xs text-muted">{p.profile?.display_name ?? "..."} · Level {p.character?.level ?? "?"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {p.confirmed ? (
                            <Badge variant="success">Confirmado</Badge>
                          ) : (
                            <>
                              <button onClick={() => handleConfirm(p.id, true)} className="p-1 rounded hover:bg-success/20 cursor-pointer"><Check size={14} className="text-success" /></button>
                              <button onClick={() => handleConfirm(p.id, false)} className="p-1 rounded hover:bg-red-500/20 cursor-pointer"><X size={14} className="text-red-400" /></button>
                            </>
                          )}
                          {canManage && (
                            <button onClick={() => handleLeave(p.id)} className="p-1 rounded hover:bg-red-500/10 cursor-pointer"><X size={14} className="text-red-400" /></button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardHeader><CardTitle>Hunt Solo</CardTitle></CardHeader>
          <div className="space-y-2">
            {participants.filter((p) => !p.is_waiting).map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-hover">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-muted" />
                  <div>
                    <p className="text-sm font-medium">{p.character?.name ?? "..."}</p>
                    <p className="text-xs text-muted">{p.profile?.display_name ?? "..."} · Level {p.character?.level ?? "?"}</p>
                  </div>
                </div>
              </div>
            ))}
            {participants.length === 0 && <p className="text-sm text-muted">Nenhum participante.</p>}
          </div>
        </Card>
      )}

      {lootItems.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Coins size={18} className="text-yellow-400" />
              <CardTitle>Loot</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-2">
            {lootItems.map((item: any) => {
              const rawSplits = item.split_among ?? [];
              const splits: { user_id: string; amount: number }[] = rawSplits.map((s: any) =>
                typeof s === "string" ? { user_id: s, amount: 0 } : s
              );
              const total = splits.reduce((sum: number, s: any) => sum + (s.amount || 0), 0);
              return (
                <div key={item.id} className="p-3 rounded-lg bg-surface-hover">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Total: {(total || item.value || 0).toLocaleString("pt-BR")} gp</span>
                  </div>
                  <div className="space-y-1">
                    {splits.map((s: any) => {
                      const p = participants.find((pt) => pt.user_id === s.user_id);
                      return (
                        <div key={s.user_id} className="flex items-center justify-between text-xs">
                          <span>
                            <span className={p?.character?.vocation ? VOCATIONS[p.character.vocation].color : "text-muted"}>
                              {p?.character?.vocation ?? "?"}
                            </span>{" "}
                            {p?.character?.name ?? "?"}
                          </span>
                          <span className="text-muted">{(s.amount || 0).toLocaleString("pt-BR")} gp</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {participants.some((p) => p.is_waiting) && (
        <Card>
          <CardHeader><CardTitle>Fila de Espera</CardTitle></CardHeader>
          <div className="space-y-1">
            {participants.filter((p) => p.is_waiting).map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-hover">
                <div className="flex items-center gap-2">
                  <span className={VOCATIONS[p.vocation_slot].color}>{VOCATIONS[p.vocation_slot].short}</span>
                  <span className="text-sm">{p.character?.name}</span>
                </div>
                {canManage && <button onClick={() => handleLeave(p.id)} className="p-1 rounded hover:bg-red-500/10 cursor-pointer"><X size={14} className="text-red-400" /></button>}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={joinModalOpen} onClose={() => setJoinModalOpen(false)} title="Entrar na PT">
        <div className="space-y-4">
          {myChars.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted mb-3">Você não tem personagens cadastrados.</p>
              <Button variant="outline" onClick={() => { setJoinModalOpen(false); router.push("/dashboard/profile"); }}>Cadastrar Personagem</Button>
            </div>
          ) : (
            <>
              <Select label="Personagem" value={selectedCharId}
                onChange={(e) => { setSelectedCharId(e.target.value); validateJoin(e.target.value); }}
                options={[{ value: "", label: "Selecione..." }, ...myChars.map((c) => ({ value: c.id, label: `${c.name} (${VOCATIONS[c.vocation].short}) Level ${c.level}` }))]}
              />
              {joinValidation && (
                <div className={`p-3 rounded-lg text-sm ${joinValidation.ok ? "bg-success/10 border border-success/30 text-success" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>
                  <div className="flex items-center gap-2">{joinValidation.ok ? <Check size={16} /> : <AlertCircle size={16} />}{joinValidation.msg}</div>
                </div>
              )}
              {joinError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 flex items-center gap-2"><AlertCircle size={16} />{joinError}</div>}
              <Button onClick={handleJoin} className="w-full" disabled={!selectedCharId || !joinValidation?.ok}>Confirmar Entrada</Button>
            </>
          )}
        </div>
      </Modal>

      <Modal open={lootModalOpen} onClose={() => setLootModalOpen(false)} title={hunt?.hunt_type === "solo" ? "Registrar Loot" : "Dividir Loot"}>
        <div className="space-y-4">
          {hunt?.hunt_type === "solo" ? (
            <>
              <p className="text-sm text-muted">Informe o valor total do loot:</p>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-hover">
                <span className={`text-sm font-medium ${participants[0]?.character?.vocation ? VOCATIONS[participants[0].character.vocation].color : ""}`}>
                  {participants[0]?.character?.vocation ?? ""}
                </span>
                <span className="text-sm flex-1">{participants[0]?.character?.name ?? "..."}</span>
                <input
                  type="number"
                  placeholder="0"
                  value={lootAmounts[participants[0]?.user_id] ?? ""}
                  onChange={(e) => participants[0] && setAmount(participants[0].user_id, e.target.value)}
                  className="w-40 px-2 py-1 rounded border border-border bg-background text-foreground text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-xs text-muted">gp</span>
              </div>
            </>
          ) : (
            <>
          <p className="text-sm text-muted">Informe quanto cada jogador vai receber:</p>
          {participants.filter((p) => !p.is_waiting).length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {participants.filter((p) => !p.is_waiting).map((p) => {
                const selected = lootSplitIds.includes(p.user_id);
                return (
                  <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-surface-hover">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleSplitId(p.user_id)}
                      className="rounded border-border bg-surface checked:bg-primary flex-shrink-0"
                    />
                    <span className={`text-sm flex-shrink-0 w-8 ${p.character?.vocation ? VOCATIONS[p.character.vocation].color : ""}`}>
                      {p.character?.vocation ?? "?"}
                    </span>
                    <span className="text-sm flex-1 truncate">{p.character?.name ?? "..."}</span>
                    {selected && (
                      <input
                        type="number"
                        placeholder="0"
                        value={lootAmounts[p.user_id] ?? ""}
                        onChange={(e) => setAmount(p.user_id, e.target.value)}
                        className="w-28 px-2 py-1 rounded border border-border bg-background text-foreground text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    )}
                    {selected && <span className="text-xs text-muted w-6">gp</span>}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted">Nenhum participante na hunt.</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => {
                const allIds = participants.filter((p) => !p.is_waiting).map((p) => p.user_id);
                setLootSplitIds(allIds);
              }}
              className="text-xs text-primary hover:underline cursor-pointer"
            >
              Selecionar todos
            </button>
            <span className="text-xs text-muted">|</span>
            <button
              onClick={() => { setLootSplitIds([]); setLootAmounts({}); }}
              className="text-xs text-muted hover:text-foreground cursor-pointer"
            >
              Limpar
            </button>
          </div>
            </>
          )}
          {hunt?.hunt_type === "solo" ? (
            participants[0] && Number(lootAmounts[participants[0].user_id] || 0) > 0 && (
              <div className="p-2 rounded-lg bg-success/10 border border-success/30 text-sm text-success text-center">
                Total: {Number(lootAmounts[participants[0].user_id] || 0).toLocaleString("pt-BR")} gp
              </div>
            )
          ) : (
            lootSplitIds.length > 0 && (
              <div className="p-2 rounded-lg bg-success/10 border border-success/30 text-sm text-success text-center">
                Total: {lootSplitIds.reduce((sum, uid) => sum + (Number(lootAmounts[uid]) || 0), 0).toLocaleString("pt-BR")} gp
              </div>
            )
          )}
          {lootError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 flex items-center gap-2"><AlertCircle size={16} />{lootError}</div>}
          <Button onClick={handleSaveLoot} className="w-full" disabled={savingLoot}>
            {savingLoot ? "Salvando..." : hunt?.hunt_type === "solo" ? "Registrar Loot" : "Registrar Divisão"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
