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
import { notifyHuntCompleted, notifyHuntCancelled, notifyHuntUpdated } from "@/lib/discord";
import { notifyLevelMilestone } from "@/lib/discord";
import { Clock, Shield, User, Check, X, ArrowLeft, Lock, AlertCircle, Coins, Plus, Trash2 } from "lucide-react";

interface Hunt {
  id: string;
  name: string;
  scheduled_at: string;
  end_time: string | null;
  hunt_type: "solo" | "group";
  slots: Record<Vocation, number>;
  status: string;
  discord_message_id: string | null;
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
  const [lootLevel, setLootLevel] = useState("");
  const [lootError, setLootError] = useState("");
  const [savingLoot, setSavingLoot] = useState(false);
  const [splitterMode, setSplitterMode] = useState(false);
  const [splitterInput, setSplitterInput] = useState("");
  const [splitterResult, setSplitterResult] = useState<{ duration: string; totalLoot: number; totalSupplies: number; profitPerPlayer: number; transfers: { from: string; to: string; amount: number }[]; players: { name: string; loot: number; supplies: number; balance: number; damage: number; healing: number }[] } | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  const supabase = createClient();

  function parseHuntSplitter(input: string) {
    const lines = input.split("\n");
    let duration = "";
    let totalLoot = 0;
    let totalSupplies = 0;
    const players: { name: string; loot: number; supplies: number; balance: number; damage: number; healing: number }[] = [];
    let currentPlayer: typeof players[0] | null = null;
    let hasPerPlayerSection = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const sessionMatch = trimmed.match(/^Session:\s*(.+)/i);
      if (sessionMatch) { duration = sessionMatch[1].trim(); continue; }

      const lootMatch = trimmed.match(/^Loot:\s*([\d,.]+)/i);
      if (lootMatch && !currentPlayer) { totalLoot = parseNum(lootMatch[1]); continue; }

      const suppliesMatch = trimmed.match(/^Supplies:\s*([\d,.]+)/i);
      if (suppliesMatch && !currentPlayer) { totalSupplies = parseNum(suppliesMatch[1]); continue; }

      const lootLine = trimmed.match(/^Loot:\s*([\d,.]+)/i);
      const suppliesLine = trimmed.match(/^Supplies:\s*([\d,.]+)/i);
      const balanceLine = trimmed.match(/^Balance:\s*([-\d,.]+)/i);
      const damageLine = trimmed.match(/^Damage:\s*([\d,.]+)/i);
      const healingLine = trimmed.match(/^Healing:\s*([\d,.]+)/i);

      if (lootLine && currentPlayer) { currentPlayer.loot = parseNum(lootLine[1]); continue; }
      if (suppliesLine && currentPlayer) { currentPlayer.supplies = parseNum(suppliesLine[1]); continue; }
      if (balanceLine && currentPlayer) { currentPlayer.balance = parseNum(balanceLine[1]); continue; }
      if (damageLine && currentPlayer) { currentPlayer.damage = parseNum(damageLine[1]); continue; }
      if (healingLine && currentPlayer) { currentPlayer.healing = parseNum(healingLine[1]); continue; }

      if (balanceLine && !currentPlayer && !hasPerPlayerSection) {
        players.push({ name: "", loot: totalLoot, supplies: totalSupplies, balance: parseNum(balanceLine[1]), damage: 0, healing: 0 });
        currentPlayer = null;
        continue;
      }

      if (damageLine && !currentPlayer && !hasPerPlayerSection && players.length > 0) {
        players[0].damage = parseNum(damageLine[1]);
        continue;
      }

      if (healingLine && !currentPlayer && !hasPerPlayerSection && players.length > 0) {
        players[0].healing = parseNum(healingLine[1]);
        continue;
      }

      if (/^(Raw XP|XP|Damage\/h|Healing\/h|Killed)/i.test(trimmed)) continue;

      if (!trimmed.startsWith("Session") && !trimmed.startsWith("Loot Type") && !trimmed.startsWith("Raw XP") && !trimmed.startsWith("XP") && !trimmed.match(/^Balance:/i) && !trimmed.match(/^Loot:/i) && !trimmed.match(/^Supplies:/i) && !trimmed.match(/^Damage/) && !trimmed.match(/^Healing/) && currentPlayer && !trimmed.startsWith("\t")) {
        players.push(currentPlayer);
        currentPlayer = null;
      }

      const nameMatch = trimmed.match(/^(.+?)(?:\s*\(Leader\))?$/);
      if (nameMatch && !trimmed.match(/^(Session|Loot Type|Loot|Supplies|Balance|Damage|Healing|Raw XP|XP|Killed)/i) && !trimmed.startsWith("\t") && !trimmed.startsWith("From ") && !trimmed.includes("/h")) {
        if (currentPlayer) { players.push(currentPlayer); }
        currentPlayer = { name: nameMatch[1].trim(), loot: 0, supplies: 0, balance: 0, damage: 0, healing: 0 };
        hasPerPlayerSection = true;
      }
    }
    if (currentPlayer) { players.push(currentPlayer); }

    if (players.length === 0) return null;

    if (players.length === 1) {
      const p = players[0];
      const profit = p.balance;
      return { duration, totalLoot: p.loot, totalSupplies: p.supplies, profitPerPlayer: profit, transfers: [], players };
    }

    const totalBalance = players.reduce((s, p) => s + p.balance, 0);
    const profitPerPlayer = Math.floor(totalBalance / players.length);

    const settlements = players.map((p) => ({
      name: p.name,
      balance: p.balance - profitPerPlayer,
    }));

    const transfers: { from: string; to: string; amount: number }[] = [];
    for (const payer of settlements) {
      if (payer.balance <= 0) continue;
      let remaining = payer.balance;
      for (const receiver of settlements) {
        if (receiver.balance >= 0) continue;
        if (remaining <= 0) break;
        const amt = Math.min(remaining, -receiver.balance);
        if (amt > 0) {
          transfers.push({ from: payer.name, to: receiver.name, amount: amt });
          remaining -= amt;
          receiver.balance += amt;
        }
      }
    }

    return { duration, totalLoot, totalSupplies, profitPerPlayer, transfers, players };
  }

  function parseNum(s: string) { return Number(s.replace(/[,.]/g, "")) || 0; }

  function handleSplitterParse() {
    const result = parseHuntSplitter(splitterInput);
    setSplitterResult(result);
  }

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
      const slots = (hunt.slots || DEFAULT_SLOTS) as Record<string, number>;
      const filledSlots: Record<string, number> = {};
      participants.forEach((p) => {
        if (!p.is_waiting) {
          filledSlots[p.vocation_slot] = (filledSlots[p.vocation_slot] ?? 0) + 1;
        }
      });
      filledSlots[char.vocation] = (filledSlots[char.vocation] ?? 0) + 1;

      if (hunt.discord_message_id) {
        const creatorPart = participants.find((p) => p.user_id === hunt.created_by);
        const pNames = participants
          .filter((p) => !p.is_waiting && p.character)
          .map((p) => ({ name: p.character!.name, vocation: p.character!.vocation }));
        pNames.push({ name: char.name, vocation: char.vocation });

        notifyHuntUpdated({
          huntName: hunt.name,
          huntId: huntId,
          messageId: hunt.discord_message_id,
          scheduledAt: hunt.scheduled_at,
          endTime: hunt.end_time,
          huntType: hunt.hunt_type,
          creatorName: creatorPart?.character?.name ?? "Desconhecido",
          creatorVocation: creatorPart?.character?.vocation ?? "?",
          creatorLevel: creatorPart?.character?.level ?? 0,
          slots,
          filledSlots,
          participants: pNames,
        });
      }
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

  async function handleCancel() {
    await supabase.from("hunts").update({ status: "cancelled" }).eq("id", huntId);
    notifyAllHuntParticipants({ huntId, title: "Hunt cancelada", message: `${hunt?.name} foi cancelada.`, link: `/dashboard/hunts/${huntId}` });
    if (hunt) notifyHuntCancelled({ name: hunt.name, huntId: huntId });
    await loadHunt();
    setLootError(""); setLootSplitIds([]); setLootAmounts({}); setLootLevel(""); setLootModalOpen(true);
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

      if (splitterMode && splitterResult) {
        splits = [{ user_id: soloParticipant.user_id, amount: splitterResult.profitPerPlayer }];
        totalValue = splitterResult.profitPerPlayer;
      } else if (splitterMode) {
        setLootError("Clique em Calcular antes de registrar."); setSavingLoot(false); return;
      } else {
        const amount = Number(lootAmounts[soloParticipant.user_id] || 0);
        if (amount <= 0) { setLootError("Informe o valor do loot."); setSavingLoot(false); return; }
        splits = [{ user_id: soloParticipant.user_id, amount }];
        totalValue = amount;
      }

      // Update character level if provided
      const newLevel = Number(lootLevel);
      const oldLevel = soloParticipant.character?.level ?? 0;
      if (newLevel > 0 && newLevel !== oldLevel && soloParticipant.character_id) {
        await supabase.from("characters").update({ level: newLevel }).eq("id", soloParticipant.character_id);

        // Notify century milestone
        if (newLevel > oldLevel && Math.floor(oldLevel / 100) < Math.floor(newLevel / 100)) {
          notifyLevelMilestone({
            characterName: soloParticipant.character?.name ?? "?",
            characterVocation: soloParticipant.character?.vocation ?? "?",
            level: newLevel,
          });
        }
      }
    } else {
      if (splitterMode && splitterResult) {
        const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const pByUser = new Map<string, string>();
        const pNames: string[] = [];
        for (const p of participants.filter((q) => !q.is_waiting)) {
          const name = p.character?.name ?? "";
          if (name) {
            pByUser.set(normalize(name), p.user_id);
            pNames.push(name);
          }
        }
        const matched: string[] = [];
        const unmatched: string[] = [];
        for (const sp of splitterResult.players) {
          const key = normalize(sp.name);
          const uid = pByUser.get(key);
          if (uid) {
            splits.push({ user_id: uid, amount: splitterResult.profitPerPlayer });
            totalValue += splitterResult.profitPerPlayer;
            matched.push(sp.name);
          } else {
            unmatched.push(sp.name);
          }
        }
        if (splits.length === 0) {
          setLootError(`Jogadores na hunt: ${pNames.join(", ")} | Splitter: ${splitterResult.players.map((p) => p.name).join(", ")}`);
          setSavingLoot(false);
          return;
        }
        if (unmatched.length > 0) {
          console.warn("Splitter: jogadores não encontrados na hunt:", unmatched.join(", "));
        }
      } else if (splitterMode) {
        setLootError("Clique em Calcular Divisão antes de registrar."); setSavingLoot(false); return;
      } else {
        if (lootSplitIds.length === 0) { setLootError("Selecione pelo menos um jogador."); setSavingLoot(false); return; }
        splits = lootSplitIds.map((uid) => ({
          user_id: uid,
          amount: Number(lootAmounts[uid]) || 0,
        }));
        totalValue = splits.reduce((sum, s) => sum + s.amount, 0);
        if (totalValue <= 0) { setLootError("Informe os valores para cada jogador."); setSavingLoot(false); return; }
      }
    }

    const { error } = await supabase.from("loot_history").insert({
      hunt_id: huntId,
      item_name: "Divisão de Loot",
      value: totalValue,
      split_among: splits,
    });

    if (error) { setLootError(error.message); setSavingLoot(false); return; }

    if (hunt && hunt.status !== "completed") {
      await supabase.from("hunts").update({ status: "completed" }).eq("id", huntId);
      notifyAllHuntParticipants({ huntId, title: "Hunt encerrada", message: `${hunt?.name} foi concluída.`, link: `/dashboard/hunts/${huntId}` });
    }

    if (hunt) {
      const partList = participants
        .filter((p) => !p.is_waiting)
        .map((p) => ({
          name: p.character?.name ?? "?",
          vocation: p.character?.vocation ?? "?",
        }));
      const splitList = splits
        .map((s) => {
          const p = participants.find((pt) => pt.user_id === s.user_id);
          return {
            name: p?.character?.name ?? "?",
            amount: s.amount,
          };
        })
        .filter((s) => s.amount > 0);
      const playerStats = splitterResult
        ? splitterResult.players.map((sp) => ({
            name: sp.name,
            damage: sp.damage,
            healing: sp.healing,
            loot: sp.loot,
            supplies: sp.supplies,
          }))
        : undefined;

      notifyHuntCompleted({
        name: hunt.name,
        huntId: huntId,
        participants: partList,
        lootTotal: totalValue,
        lootSplits: splitList.length > 0 ? splitList : undefined,
        levelChange: hunt.hunt_type === "solo" ? {
          oldLevel: participants[0]?.character?.level ?? 0,
          newLevel: Number(lootLevel) || 0,
        } : undefined,
        playerStats,
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
          {canManage && (hunt.status === "open" || hunt.status === "full" || hunt.status === "completed") && (
            <Button size="sm" onClick={() => { setSplitterMode(false); setShowTutorial(false); setSplitterInput(""); setSplitterResult(null); setLootError(""); setLootSplitIds([]); setLootAmounts({}); setLootLevel(""); setLootModalOpen(true); }}>
              <Coins size={14} className="mr-1" /> Registrar Loot
            </Button>
          )}
          {canManage && (hunt.status === "open" || hunt.status === "full") && (
            <Button variant="ghost" size="sm" onClick={handleCancel}>Cancelar</Button>
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
          <div className="flex gap-2 mb-2">
                <button onClick={() => setSplitterMode(false)} className={`flex-1 py-1.5 text-sm rounded-md cursor-pointer ${!splitterMode ? "bg-primary text-primary-foreground" : "border border-border hover:bg-surface-hover text-foreground"}`}>Manual</button>
                <button onClick={() => { setSplitterMode(true); setShowTutorial(true); }} className={`flex-1 py-1.5 text-sm rounded-md cursor-pointer ${splitterMode ? "bg-primary text-primary-foreground" : "border border-border hover:bg-surface-hover text-foreground"}`}>Hunt Splitter</button>
              </div>

              {splitterMode ? (
                <div className="space-y-4">
                  {showTutorial && (
                    <div className="relative p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <button onClick={() => setShowTutorial(false)} className="absolute top-2 right-2 p-1 rounded hover:bg-amber-500/20 cursor-pointer">
                        <X size={14} className="text-amber-400" />
                      </button>
                      <p className="text-xs text-amber-400 font-medium mb-2">Como obter os dados:</p>
                      <img src="/party-loot.jpg" alt="Tutorial Party Loot" className="w-full rounded-lg border border-border" />
                    </div>
                  )}
                  <p className="text-sm text-muted">Cole os dados da sessão (Party Loot do Tibia):</p>
                  <textarea
                    value={splitterInput}
                    onChange={(e) => setSplitterInput(e.target.value)}
                    placeholder={`Session data: From 2024-01-01, 15:00:00 to 2024-01-01, 16:00:00\nSession: 01:00h\nLoot Type: Market\nLoot: 711,112\nSupplies: 662,148\nBalance: 48,964\nPlayer 1\n\tLoot: 349,363\n\tSupplies: 98,318\n\tBalance: 251,045`}
                    className="w-full h-48 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                  <Button onClick={handleSplitterParse} className="w-full">Calcular</Button>

                  {splitterResult && (
                    <div className="space-y-3 p-4 rounded-lg bg-surface-hover border border-border">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-muted">Duração:</span> <span className="font-medium">{splitterResult.duration}</span></div>
                        <div><span className="text-muted">Loot Total:</span> <span className="font-medium">{splitterResult.totalLoot.toLocaleString("pt-BR")} gp</span></div>
                        <div><span className="text-muted">Supplies:</span> <span className="font-medium text-red-400">{splitterResult.totalSupplies.toLocaleString("pt-BR")} gp</span></div>
                        <div><span className="text-muted">Profit:</span> <span className={`font-medium ${splitterResult.profitPerPlayer >= 0 ? "text-success" : "text-red-400"}`}>{splitterResult.profitPerPlayer.toLocaleString("pt-BR")} gp</span></div>
                        {splitterResult.players.length === 1 && splitterResult.players[0] && (
                          <>
                            <div><span className="text-muted">Damage:</span> <span className="font-medium">{splitterResult.players[0].damage.toLocaleString("pt-BR")}</span></div>
                            <div><span className="text-muted">Healing:</span> <span className="font-medium">{splitterResult.players[0].healing.toLocaleString("pt-BR")}</span></div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
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

              <p className="text-sm text-muted">Qual o level atual do personagem?</p>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-hover">
                <span className="text-sm text-muted">
                  {participants[0]?.character?.level != null
                    ? `Level atual: ${participants[0].character.level}`
                    : ""}
                </span>
                <input
                  type="number"
                  placeholder="Level"
                  value={lootLevel}
                  onChange={(e) => setLootLevel(e.target.value)}
                  className="w-28 px-2 py-1 rounded border border-border bg-background text-foreground text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary ml-auto"
                />
              </div>
                </>
              )}
              {lootError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 flex items-center gap-2"><AlertCircle size={16} />{lootError}</div>}
              <Button onClick={handleSaveLoot} className="w-full" disabled={savingLoot}>
                {savingLoot ? "Salvando..." : "Registrar Loot"}
              </Button>
            </>
          ) : (
            <>
          <div className="flex gap-2 mb-2">
                <button onClick={() => setSplitterMode(false)} className={`flex-1 py-1.5 text-sm rounded-md cursor-pointer ${!splitterMode ? "bg-primary text-primary-foreground" : "border border-border hover:bg-surface-hover text-foreground"}`}>Manual</button>
                <button onClick={() => { setSplitterMode(true); setShowTutorial(true); }} className={`flex-1 py-1.5 text-sm rounded-md cursor-pointer ${splitterMode ? "bg-primary text-primary-foreground" : "border border-border hover:bg-surface-hover text-foreground"}`}>Hunt Splitter</button>
              </div>

              {splitterMode ? (
                <div className="space-y-4">
                  {showTutorial && (
                    <div className="relative p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <button onClick={() => setShowTutorial(false)} className="absolute top-2 right-2 p-1 rounded hover:bg-amber-500/20 cursor-pointer">
                        <X size={14} className="text-amber-400" />
                      </button>
                      <p className="text-xs text-amber-400 font-medium mb-2">Como obter os dados:</p>
                      <img src="/party-loot.jpg" alt="Tutorial Party Loot" className="w-full rounded-lg border border-border" />
                    </div>
                  )}
                  <p className="text-sm text-muted">Cole os dados da sessão (Party Loot do Tibia):</p>
                  <textarea
                    value={splitterInput}
                    onChange={(e) => setSplitterInput(e.target.value)}
                    placeholder={`Session data: From 2024-01-01, 15:00:00 to 2024-01-01, 16:00:00\nSession: 01:00h\nLoot Type: Market\nLoot: 711,112\nSupplies: 662,148\nBalance: 48,964\nPlayer 1\n\tLoot: 349,363\n\tSupplies: 98,318\n\tBalance: 251,045\nPlayer 2\n\t...`}
                    className="w-full h-48 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                  <Button onClick={handleSplitterParse} className="w-full">Calcular Divisão</Button>

                  {splitterResult && (
                    <div className="space-y-3 p-4 rounded-lg bg-surface-hover border border-border">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-muted">Duração:</span> <span className="font-medium">{splitterResult.duration}</span></div>
                        <div><span className="text-muted">Profit por jogador:</span> <span className="font-medium text-success">{splitterResult.profitPerPlayer.toLocaleString("pt-BR")} gp</span></div>
                        <div><span className="text-muted">Loot Total:</span> <span className="font-medium">{splitterResult.totalLoot.toLocaleString("pt-BR")} gp</span></div>
                        <div><span className="text-muted">Supplies Total:</span> <span className="font-medium text-red-400">{splitterResult.totalSupplies.toLocaleString("pt-BR")} gp</span></div>
                      </div>

                      {splitterResult.transfers.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted font-medium">Transferências</p>
                          {splitterResult.transfers.map((t, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs p-2 rounded bg-background">
                              <span className="font-medium">{t.from}</span>
                              <span className="text-muted">→</span>
                              <span className="font-medium">{t.to}</span>
                              <span className="ml-auto text-success font-medium">{t.amount.toLocaleString("pt-BR")} gp</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
            <>
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
          {lootSplitIds.length > 0 && !splitterMode && (
            <div className="p-2 rounded-lg bg-success/10 border border-success/30 text-sm text-success text-center">
              Total: {lootSplitIds.reduce((sum, uid) => sum + (Number(lootAmounts[uid]) || 0), 0).toLocaleString("pt-BR")} gp
            </div>
          )}
          {lootError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 flex items-center gap-2"><AlertCircle size={16} />{lootError}</div>}
          <Button onClick={handleSaveLoot} className="w-full" disabled={savingLoot}>
            {savingLoot ? "Salvando..." : "Registrar Divisão"}
          </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
