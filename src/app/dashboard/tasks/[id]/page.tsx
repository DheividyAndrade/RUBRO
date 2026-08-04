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
import { VOCATIONS, type Vocation, sharedExpRange, cn } from "@/lib/utils";
import { notifyTaskCreated, notifyTaskCompleted } from "@/lib/discord";
import { ArrowLeft, Clock, Shield, User, Check, X, AlertCircle, Swords, MapPin, Coins } from "lucide-react";

interface Task {
  id: string;
  creature: string;
  location: string;
  scheduled_at: string;
  hunt_type: "solo" | "group";
  slots: Record<Vocation, number>;
  status: string;
  discord_message_id: string | null;
  notes: string | null;
  created_by: string;
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
const TASK_STATUS: Record<string, string> = { open: "Aberta", full: "Lotada", completed: "Concluída", cancelled: "Cancelada" };

function parseNum(s: string) { return Number(s.replace(/[,.]/g, "")) || 0; }

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [myChars, setMyChars] = useState<{ id: string; name: string; vocation: Vocation; level: number }[]>([]);
  const [myUserId, setMyUserId] = useState<string>("");
  const [myRole, setMyRole] = useState<string>("MEMBER");
  const [loading, setLoading] = useState(true);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [selectedCharId, setSelectedCharId] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinValidation, setJoinValidation] = useState<{ ok: boolean; msg: string } | null>(null);

  const [lootModalOpen, setLootModalOpen] = useState(false);
  const [lootSplitIds, setLootSplitIds] = useState<string[]>([]);
  const [lootAmounts, setLootAmounts] = useState<Record<string, string>>({});
  const [lootLevel, setLootLevel] = useState("");
  const [lootError, setLootError] = useState("");
  const [savingLoot, setSavingLoot] = useState(false);
  const [splitterMode, setSplitterMode] = useState(false);
  const [splitterInput, setSplitterInput] = useState("");
  const [showTutorial, setShowTutorial] = useState(false);
  const [splitterResult, setSplitterResult] = useState<{ duration: string; totalLoot: number; totalSupplies: number; profitPerPlayer: number; guildTax: number; xpPerHour: number; transfers: { from: string; to: string; amount: number }[]; players: { name: string; loot: number; supplies: number; balance: number; damage: number; healing: number; tax: number }[] } | null>(null);

  const supabase = createClient();

  useEffect(() => { loadTask(); }, [taskId]);

  async function loadTask() {
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) return;
    setMyUserId(user.id);

    const [{ data: taskData }, { data: parts }, { data: chars }, { data: profile }] = await Promise.all([
      supabase.from("tasks").select("*").eq("id", taskId).single(),
      supabase.from("task_participants").select("*").eq("task_id", taskId).order("is_waiting"),
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

    setTask(taskData);
    setParticipants(mapped);
    setMyChars(chars ?? []);
    setMyRole(profile?.role ?? "MEMBER");
    setLoading(false);
  }

  function validateJoin(charId: string) {
    const char = myChars.find((c) => c.id === charId);
    if (!char || !task) return;
    if (task.hunt_type === "solo") {
      setJoinValidation({ ok: false, msg: "Esta task é Solo." });
      return;
    }
    if (task.status !== "open" && task.status !== "full") {
      setJoinValidation({ ok: false, msg: "Esta task não está mais aberta." });
      return;
    }
  const slots = (task.slots || DEFAULT_SLOTS) as Record<Vocation, number>;
  const creatorParticipant = participants.find((p) => p.user_id === task.created_by);
  const creatorLevel = creatorParticipant?.character?.level ?? 0;
  const range = creatorLevel > 0 ? sharedExpRange(creatorLevel) : null;
    const creatorPart = participants.find((p) => p.user_id === task.created_by);
    if (creatorPart?.character?.level) {
      const r = sharedExpRange(creatorPart.character.level);
      if (char.level < r.min || char.level > r.max) {
        setJoinValidation({ ok: false, msg: `Seu level (${char.level}) está fora do Shared Experience (${r.min} – ${r.max}).` });
        return;
      }
    }
    const slotMax = slots[char.vocation] ?? 0;
    if (slotMax === 0) {
      setJoinValidation({ ok: false, msg: `Vaga para ${char.vocation} não disponível.` });
      return;
    }
    const inSlot = participants.filter((p) => p.vocation_slot === char.vocation && !p.is_waiting).length;
    if (inSlot >= slotMax) {
      setJoinValidation({ ok: false, msg: `Vaga para ${char.vocation} já lotada.` });
      return;
    }
    if (participants.some((p) => p.user_id === myUserId && !p.is_waiting)) {
      setJoinValidation({ ok: false, msg: "Você já está na task." });
      return;
    }
    setJoinValidation({ ok: true, msg: `Vaga disponível para ${char.vocation}!` });
  }

  async function handleJoin() {
    if (!joinValidation?.ok || !selectedCharId) return;
    const char = myChars.find((c) => c.id === selectedCharId);
    if (!char || !task) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("task_participants").insert({
      task_id: taskId, user_id: user.id, character_id: char.id, vocation_slot: char.vocation, confirmed: false, is_waiting: false,
    });
    if (error) { if (error.code === "23505") setJoinError("Você já está nesta task."); else setJoinError(error.message); return; }
    setJoinModalOpen(false); setSelectedCharId(""); setJoinValidation(null); setJoinError("");
    await loadTask();
  }

  async function handleLeave(participantId: string) {
    await supabase.from("task_participants").delete().eq("id", participantId);
    loadTask();
  }

  async function handleConfirm(participantId: string, value: boolean) {
    await supabase.from("task_participants").update({ confirmed: value }).eq("id", participantId);
    loadTask();
  }

  async function handleCancel() {
    await supabase.from("tasks").update({ status: "cancelled" }).eq("id", taskId);
    await loadTask();
  }

  async function handleDelete() {
    if (!confirm("Excluir esta task permanentemente?")) return;
    await supabase.from("tasks").delete().eq("id", taskId);
    router.push("/dashboard/tasks");
  }

  function toggleSplitId(id: string) {
    setLootSplitIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function setAmount(userId: string, value: string) {
    setLootAmounts((prev) => ({ ...prev, [userId]: value }));
  }

  function parseHuntSplitter(input: string) {
    const lines = input.split("\n");
    let duration = "", totalLoot = 0, totalSupplies = 0, xpPerHour = 0;
    const players: { name: string; loot: number; supplies: number; balance: number; damage: number; healing: number }[] = [];
    let currentPlayer: typeof players[0] | null = null, hasPerPlayerSection = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (line.startsWith("\t") || (line.startsWith(" ") && !trimmed.match(/^(Loot|Supplies|Balance|Damage|Healing):/i))) continue;
      const sMatch = trimmed.match(/^Session:\s*(.+)/i);
      if (sMatch) { duration = sMatch[1].trim(); continue; }
      const lMatch = trimmed.match(/^Loot:\s*([\d,.]+)/i);
      if (lMatch && !currentPlayer) { totalLoot = parseNum(lMatch[1]); continue; }
      const suMatch = trimmed.match(/^Supplies:\s*([\d,.]+)/i);
      if (suMatch && !currentPlayer) { totalSupplies = parseNum(suMatch[1]); continue; }
      const xpMatch = trimmed.match(/^Raw XP\/h:\s*([\d,.]+)/i);
      if (xpMatch && !currentPlayer) { xpPerHour = parseNum(xpMatch[1]); continue; }
      const lLine = trimmed.match(/^Loot:\s*([\d,.]+)/i);
      const sLine = trimmed.match(/^Supplies:\s*([\d,.]+)/i);
      const bLine = trimmed.match(/^Balance:\s*([-\d,.]+)/i);
      const dLine = trimmed.match(/^Damage:\s*([\d,.]+)/i);
      const hLine = trimmed.match(/^Healing:\s*([\d,.]+)/i);
      if (lLine && currentPlayer) { currentPlayer.loot = parseNum(lLine[1]); continue; }
      if (sLine && currentPlayer) { currentPlayer.supplies = parseNum(sLine[1]); continue; }
      if (bLine && currentPlayer) { currentPlayer.balance = parseNum(bLine[1]); continue; }
      if (dLine && currentPlayer) { currentPlayer.damage = parseNum(dLine[1]); continue; }
      if (hLine && currentPlayer) { currentPlayer.healing = parseNum(hLine[1]); continue; }
      if (bLine && !currentPlayer && !hasPerPlayerSection) {
        players.push({ name: "", loot: totalLoot, supplies: totalSupplies, balance: parseNum(bLine[1]), damage: 0, healing: 0 });
        continue;
      }
      if (dLine && !currentPlayer && !hasPerPlayerSection && players.length > 0) { players[0].damage = parseNum(dLine[1]); continue; }
      if (hLine && !currentPlayer && !hasPerPlayerSection && players.length > 0) { players[0].healing = parseNum(hLine[1]); continue; }
      if (/^(Raw XP|XP|Damage\/h|Healing\/h|Killed)/i.test(trimmed)) continue;
      if (!trimmed.startsWith("Session") && !trimmed.startsWith("Loot Type") && !trimmed.startsWith("Raw XP") && !trimmed.startsWith("XP") && !trimmed.match(/^Balance:/i) && !trimmed.match(/^Loot:/i) && !trimmed.match(/^Supplies:/i) && !trimmed.match(/^Damage/) && !trimmed.match(/^Healing/) && currentPlayer && !trimmed.startsWith("\t")) {
        players.push(currentPlayer); currentPlayer = null;
      }
      const nameMatch = trimmed.match(/^(.+?)(?:\s*\(Leader\))?$/);
      if (nameMatch && !trimmed.match(/^(Session|Loot Type|Loot|Supplies|Balance|Damage|Healing|Raw XP|XP|Killed)/i) && !trimmed.startsWith("\t") && !trimmed.startsWith("From ") && !trimmed.includes("/h")) {
        if (currentPlayer) players.push(currentPlayer);
        currentPlayer = { name: nameMatch[1].trim(), loot: 0, supplies: 0, balance: 0, damage: 0, healing: 0 };
        hasPerPlayerSection = true;
      }
    }
    if (currentPlayer) players.push(currentPlayer);
    if (players.length === 0) return null;

    const GUILD_TAX_RATE = 0.02;
    let totalTax = 0;
    const withTax = players.map((p) => {
      const tax = p.balance > 0 ? Math.floor(p.balance * GUILD_TAX_RATE) : 0;
      totalTax += tax;
      return { ...p, tax, afterTax: p.balance - tax };
    });

    if (withTax.length === 1) {
      const p = withTax[0];
      const soloTax = p.balance > 0 ? Math.floor(p.balance * GUILD_TAX_RATE) : 0;
      const soloTransfers = soloTax > 0 ? [{ from: p.name || "Jogador", to: "Rubro Bank", amount: soloTax }] : [];
      return { duration, totalLoot: p.loot, totalSupplies: p.supplies, profitPerPlayer: p.balance - soloTax, transfers: soloTransfers, players: [{ ...p, tax: soloTax }], guildTax: soloTax, xpPerHour };
    }

    const activePlayers = players.filter((p) => p.name);
    const guildTax = Math.floor(totalLoot * GUILD_TAX_RATE);
    const netLoot = totalLoot - guildTax;
    const totalBalance = netLoot - totalSupplies;
    const profitPerPlayer = Math.floor(totalBalance / activePlayers.length);

    const entries: { name: string; supplies: number; loot: number; diff: number }[] = [];
    let taxRemainder = guildTax;
    for (let i = 0; i < activePlayers.length; i++) {
      const p = activePlayers[i];
      const taxShare = i === activePlayers.length - 1 ? taxRemainder : Math.floor(guildTax / activePlayers.length);
      taxRemainder -= taxShare;
      const target = p.supplies + profitPerPlayer;
      const current = p.loot - taxShare;
      entries.push({ name: p.name, supplies: p.supplies, loot: p.loot, diff: target - current });
    }

    const payers = entries.filter((e) => e.diff < 0).map((e) => ({ name: e.name, amount: -e.diff })).sort((a, b) => a.amount - b.amount);
    const receivers = entries.filter((e) => e.diff > 0).map((e) => ({ name: e.name, amount: e.diff })).sort((a, b) => a.amount - b.amount);
    const transfers: { from: string; to: string; amount: number }[] = [];
    let pi = 0, ri = 0;
    while (pi < payers.length && ri < receivers.length) {
      const amt = Math.min(payers[pi].amount, receivers[ri].amount);
      if (amt > 0) transfers.push({ from: payers[pi].name, to: receivers[ri].name, amount: amt });
      payers[pi].amount -= amt; receivers[ri].amount -= amt;
      if (payers[pi].amount <= 0) pi++;
      if (receivers[ri].amount <= 0) ri++;
    }
    const guildPayer = entries.reduce((a, b) => a.diff < b.diff ? a : b);
    if (guildTax > 0) transfers.push({ from: guildPayer.name, to: "Rubro Bank", amount: guildTax });

    const playerResults = activePlayers.map((p) => ({ ...p, tax: Math.floor(guildTax / activePlayers.length) }));
    return { duration, totalLoot, totalSupplies, profitPerPlayer, transfers, players: playerResults, guildTax, xpPerHour };
  }

  function handleSplitterParse() {
    setSplitterResult(parseHuntSplitter(splitterInput));
  }

  function renderSplitterResult(isGroup: boolean) {
    if (!splitterResult) return null;
    const fields: string[][] = [["Duração:", splitterResult.duration]];
    if (isGroup) {
      fields.push(["Loot Total:", `${splitterResult.totalLoot.toLocaleString("pt-BR")} gp`]);
      fields.push(["Supplies Total:", `${splitterResult.totalSupplies.toLocaleString("pt-BR")} gp`]);
      fields.push(["Profit p/ jogador:", `${splitterResult.profitPerPlayer.toLocaleString("pt-BR")} gp`]);
      fields.push(["Taxa Guilda (2%):", `${splitterResult.guildTax.toLocaleString("pt-BR")} gp`]);
    } else {
      fields.push(["Loot Total:", `${splitterResult.totalLoot.toLocaleString("pt-BR")} gp`]);
      fields.push(["Raw XP/h:", splitterResult.xpPerHour.toLocaleString("pt-BR")]);
      fields.push(["Profit:", `${splitterResult.profitPerPlayer.toLocaleString("pt-BR")} gp`]);
      fields.push(["Taxa Guilda (2%):", `${splitterResult.guildTax.toLocaleString("pt-BR")} gp`]);
    }
    return (
      <div className="space-y-3 p-4 rounded-lg bg-surface-hover border border-border">
        <div className="grid grid-cols-2 gap-2 text-sm">
          {fields.map(([label, value], i) => {
            const isSuccess = label === "Profit:" || label === "Profit p/ jogador:";
            const isSupplies = label === "Supplies Total:";
            const isTax = label === "Taxa Guilda (2%):";
            return (
              <div key={i}>
                <span className="text-muted">{label}</span> <span className={cn("font-medium", isSuccess ? (splitterResult.profitPerPlayer >= 0 ? "text-success" : "text-red-400") : isSupplies ? "text-red-400" : isTax ? "text-amber-400" : "")}>{value}</span>
              </div>
            );
          })}
        </div>
        {splitterResult.transfers.length > 0 && (
          <div className="space-y-1 mt-2">
            <p className="text-xs text-muted font-medium">Transferencias</p>
            {splitterResult.transfers.map((t, i) => {
              const isGuild = t.to === "Rubro Bank";
              return (
              <div key={i} className={cn("flex items-center gap-2 text-xs p-2 rounded", isGuild ? "bg-amber-500/10 border border-amber-500/20" : "bg-background")}>
                <span className="font-medium">{t.from}</span>
                <span className="text-muted">→</span>
                <span className={isGuild ? "font-medium text-amber-400" : "font-medium"}>{t.to}</span>
                <span className={cn("ml-auto font-medium", isGuild ? "text-amber-400" : "text-success")}>{t.amount.toLocaleString("pt-BR")} gp</span>
              </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  async function handleSaveLoot() {
    setSavingLoot(true); setLootError("");
    let splits: { user_id: string; amount: number }[] = [];
    let totalValue = 0;

    if (task?.hunt_type === "solo") {
      const soloParticipant = participants.find((p) => !p.is_waiting);
      if (!soloParticipant) { setLootError("Nenhum participante."); setSavingLoot(false); return; }
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
      const newLevel = Number(lootLevel);
      if (newLevel > 0 && soloParticipant.character_id) {
        await supabase.from("characters").update({ level: newLevel }).eq("id", soloParticipant.character_id);
      }
    } else {
      if (splitterMode && splitterResult) {
        const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const pByUser = new Map<string, string>();
        const pNames: string[] = [];
        for (const p of participants.filter((q) => !q.is_waiting)) {
          const n = p.character?.name ?? "";
          if (n) { pByUser.set(normalize(n), p.user_id); pNames.push(n); }
        }
        for (const sp of splitterResult.players) {
          const uid = pByUser.get(normalize(sp.name));
          if (uid) { splits.push({ user_id: uid, amount: splitterResult.profitPerPlayer }); totalValue += splitterResult.profitPerPlayer; }
        }
        if (splits.length === 0) {
          setLootError(`Jogadores na task: ${pNames.join(", ")} | Splitter: ${splitterResult.players.map((p) => p.name || "(solo)").join(", ")}`);
          setSavingLoot(false); return;
        }
      } else if (splitterMode) {
        setLootError("Clique em Calcular Divisão antes de registrar."); setSavingLoot(false); return;
      } else {
        if (lootSplitIds.length === 0) { setLootError("Selecione pelo menos um jogador."); setSavingLoot(false); return; }
        splits = lootSplitIds.map((uid) => ({ user_id: uid, amount: Number(lootAmounts[uid]) || 0 }));
        totalValue = splits.reduce((sum, s) => sum + s.amount, 0);
        if (totalValue <= 0) { setLootError("Informe os valores."); setSavingLoot(false); return; }
      }
    }

    const { error } = await supabase.from("loot_history").insert({
      task_id: taskId, item_name: "Divisão de Loot", value: totalValue, split_among: splits,
    });
    if (error) { setLootError(error.message); setSavingLoot(false); return; }

    if (task && task.status !== "completed") {
      await supabase.from("tasks").update({ status: "completed" }).eq("id", taskId);
    }

    if (task) {
      const partList = participants.filter((p) => !p.is_waiting).map((p) => ({ name: p.character?.name ?? "?", vocation: p.character?.vocation ?? "?" }));
      const splitList = splits.map((s) => { const p = participants.find((pt) => pt.user_id === s.user_id); return { name: p?.character?.name ?? "?", amount: s.amount }; }).filter((s) => s.amount > 0);
      const playerStats = splitterResult ? splitterResult.players.map((sp) => ({ name: sp.name, damage: sp.damage, healing: sp.healing, loot: sp.loot, supplies: sp.supplies })) : undefined;
      const taxPerPlayer = splitterResult ? splitterResult.players.filter((p) => p.tax > 0).map((p) => ({ name: p.name, amount: p.tax })) : undefined;
      notifyTaskCompleted({
        creature: task.creature, taskId,
        participants: partList,
        lootTotal: totalValue,
        lootSplits: splitList.length > 0 ? splitList : undefined,
        playerStats,
        guildTax: (splitterResult?.guildTax ?? 0) > 0 ? splitterResult!.guildTax : undefined,
        taxPerPlayer: taxPerPlayer && taxPerPlayer.length > 0 ? taxPerPlayer : undefined,
      });
    }

    setLootModalOpen(false); setLootSplitIds([]); setLootAmounts({}); setSavingLoot(false);
    await loadTask();
  }

  const isAdmin = myRole === "LEADER" || myRole === "VICE";
  const isCreator = task?.created_by === myUserId;
  const canManage = isAdmin || isCreator;

  if (loading || !task) {
    return <div className="space-y-6 animate-pulse"><div className="h-8 w-48 bg-surface rounded" /><div className="h-64 bg-surface rounded-xl" /></div>;
  }

  const slots = (task.slots || DEFAULT_SLOTS) as Record<Vocation, number>;

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted hover:text-foreground cursor-pointer">
        <ArrowLeft size={16} /> Voltar
      </button>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{task.creature}</h1>
            {task.hunt_type === "solo" && <Badge variant="default">Solo</Badge>}
            <Badge variant={task.status === "open" ? "success" : task.status === "full" ? "warning" : task.status === "completed" ? "default" : "danger"}>
              {TASK_STATUS[task.status] ?? task.status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted">
            <span className="flex items-center gap-1"><MapPin size={14} />{task.location}</span>
            <span className="flex items-center gap-1"><Clock size={14} />{new Date(task.scheduled_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
            {range && task.hunt_type === "group" && (
              <span className="flex items-center gap-1"><Shield size={14} />Shared: {range.min} – {range.max}</span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {task.status === "open" && task.hunt_type === "group" && !participants.some((p) => p.user_id === myUserId) && (
            <Button onClick={() => { setSelectedCharId(""); setJoinValidation(null); setJoinError(""); setJoinModalOpen(true); }}>Entrar na Task</Button>
          )}
          {canManage && (task.status === "open" || task.status === "full" || task.status === "completed") && (
            <Button size="sm" onClick={() => { setSplitterMode(false); setShowTutorial(false); setSplitterInput(""); setSplitterResult(null); setLootError(""); setLootSplitIds([]); setLootAmounts({}); setLootLevel(""); setLootModalOpen(true); }}>
              <Coins size={14} className="mr-1" /> Registrar Loot
            </Button>
          )}
          {canManage && (task.status === "open" || task.status === "full") && (
            <Button variant="ghost" size="sm" onClick={handleCancel}>Cancelar</Button>
          )}
          {canManage && (
            <Button variant="ghost" size="sm" onClick={handleDelete} title="Excluir"><X size={16} className="text-red-400" /></Button>
          )}
        </div>
      </div>

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
                    <span className={cn("font-bold text-lg", VOCATIONS[voc].color)}>{VOCATIONS[voc].short}</span>
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
                        {p.confirmed ? <Badge variant="success">Confirmado</Badge> : (
                          <>
                            <button onClick={() => handleConfirm(p.id, true)} className="p-1 rounded hover:bg-success/20 cursor-pointer"><Check size={14} className="text-success" /></button>
                            <button onClick={() => handleConfirm(p.id, false)} className="p-1 rounded hover:bg-red-500/20 cursor-pointer"><X size={14} className="text-red-400" /></button>
                          </>
                        )}
                        {canManage && <button onClick={() => handleLeave(p.id)} className="p-1 rounded hover:bg-red-500/10 cursor-pointer"><X size={14} className="text-red-400" /></button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Modal open={joinModalOpen} onClose={() => setJoinModalOpen(false)} title="Entrar na Task">
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
                <div className={cn("p-3 rounded-lg text-sm", joinValidation.ok ? "bg-success/10 border border-success/30 text-success" : "bg-red-500/10 border border-red-500/30 text-red-400")}>
                  <div className="flex items-center gap-2">{joinValidation.ok ? <Check size={16} /> : <AlertCircle size={16} />}{joinValidation.msg}</div>
                </div>
              )}
              {joinError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 flex items-center gap-2"><AlertCircle size={16} />{joinError}</div>}
              <Button onClick={handleJoin} className="w-full" disabled={!selectedCharId || !joinValidation?.ok}>Confirmar Entrada</Button>
            </>
          )}
        </div>
      </Modal>

      <Modal open={lootModalOpen} onClose={() => setLootModalOpen(false)} title={task?.hunt_type === "solo" ? "Registrar Loot" : "Dividir Loot"}>
        <div className="space-y-4">
          <div className="flex gap-2 mb-2">
            <button onClick={() => setSplitterMode(false)} className={cn("flex-1 py-1.5 text-sm rounded-md cursor-pointer", !splitterMode ? "bg-primary text-primary-foreground" : "border border-border hover:bg-surface-hover text-foreground")}>Manual</button>
            <button onClick={() => { setSplitterMode(true); setShowTutorial(true); }} className={cn("flex-1 py-1.5 text-sm rounded-md cursor-pointer", splitterMode ? "bg-primary text-primary-foreground" : "border border-border hover:bg-surface-hover text-foreground")}>Hunt Splitter</button>
          </div>

          {splitterMode ? (
            <div className="space-y-4">
              {showTutorial && (
                <div className="relative p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <button onClick={() => setShowTutorial(false)} className="absolute top-2 right-2 p-1 rounded hover:bg-amber-500/20 cursor-pointer"><X size={14} className="text-amber-400" /></button>
                  <p className="text-xs text-amber-400 font-medium mb-2">Como obter os dados:</p>
                  <img src={task?.hunt_type === "solo" ? "/hunting-analy.png" : "/party-loot.jpg"} alt="Tutorial" className="w-full rounded-lg border border-border" />
                </div>
              )}
              <p className="text-sm text-muted">Cole os dados da sessão:</p>
              <textarea value={splitterInput} onChange={(e) => setSplitterInput(e.target.value)} placeholder="Cole aqui os dados da sessao do Tibia (Party Loot)"
                className="w-full h-48 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
              <Button onClick={handleSplitterParse} className="w-full">Calcular Divisão</Button>
              {renderSplitterResult(task?.hunt_type === "group")}
              {task?.hunt_type === "solo" && (
                <>
                  <p className="text-sm text-muted mt-4">Qual o level atual do personagem?</p>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-hover">
                    <span className="text-sm text-muted">{participants[0]?.character?.level != null ? `Level atual: ${participants[0].character.level}` : ""}</span>
                    <input type="number" placeholder="Level" value={lootLevel} onChange={(e) => setLootLevel(e.target.value)}
                      className="w-28 px-2 py-1 rounded border border-border bg-background text-foreground text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary ml-auto" />
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm text-muted">Informe quanto cada jogador vai receber:</p>
              {participants.filter((p) => !p.is_waiting).length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {participants.filter((p) => !p.is_waiting).map((p) => {
                    const selected = lootSplitIds.includes(p.user_id);
                    return (
                      <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-surface-hover">
                        <input type="checkbox" checked={selected} onChange={() => toggleSplitId(p.user_id)} className="rounded border-border bg-surface checked:bg-primary flex-shrink-0" />
                        <span className={cn("text-sm flex-shrink-0 w-8", p.character?.vocation ? VOCATIONS[p.character.vocation].color : "")}>{p.character?.vocation ?? "?"}</span>
                        <span className="text-sm flex-1 truncate">{p.character?.name ?? "..."}</span>
                        {selected && <input type="number" placeholder="0" value={lootAmounts[p.user_id] ?? ""} onChange={(e) => setAmount(p.user_id, e.target.value)}
                          className="w-28 px-2 py-1 rounded border border-border bg-background text-foreground text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary" />}
                        {selected && <span className="text-xs text-muted w-6">gp</span>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted">Nenhum participante.</p>
              )}
              <div className="flex gap-2">
                <button onClick={() => setLootSplitIds(participants.filter((p) => !p.is_waiting).map((p) => p.user_id))} className="text-xs text-primary hover:underline cursor-pointer">Selecionar todos</button>
                <span className="text-xs text-muted">|</span>
                <button onClick={() => { setLootSplitIds([]); setLootAmounts({}); }} className="text-xs text-muted hover:text-foreground cursor-pointer">Limpar</button>
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
            {savingLoot ? "Salvando..." : task?.hunt_type === "solo" ? "Registrar Loot" : "Registrar Divisão"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
