"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { VOCATIONS, type Vocation, WEEKDAYS, sharedExpRange } from "@/lib/utils";
import { notifyBossJoined, notifyBossRotationUpdated } from "@/lib/discord";
import { ArrowLeft, Clock, Shield, User, Check, X, Skull, Calendar } from "lucide-react";

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

interface Participant {
  id: string;
  user_id: string;
  character_id: string;
  confirmed: boolean;
  killed_at: string | null;
  character: { name: string; level: number; vocation: Vocation } | null;
  profile: { display_name: string; role: string } | null;
}

export default function BossDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bossId = params.id as string;

  const [boss, setBoss] = useState<Boss | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [myChars, setMyChars] = useState<{ id: string; name: string; vocation: Vocation; level: number }[]>([]);
  const [myUserId, setMyUserId] = useState("");
  const [myRole, setMyRole] = useState("MEMBER");
  const [loading, setLoading] = useState(true);
  const [sharedRange, setSharedRange] = useState<{ min: number; max: number } | null>(null);
  const [joinCharId, setJoinCharId] = useState("");
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  useEffect(() => { loadBoss(); }, [bossId]);

  async function loadBoss() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setMyUserId(user.id);

    const [{ data: b }, { data: p }, { data: c }, { data: prof }] = await Promise.all([
      supabase.from("bosses").select("*").eq("id", bossId).single(),
      supabase.from("boss_participants").select("*").eq("boss_id", bossId).order("confirmed", { ascending: false }),
      supabase.from("characters").select("id,name,vocation,level").eq("user_id", user.id),
      supabase.from("profiles").select("role").eq("id", user.id).single(),
    ]);

    const characterIds = [...new Set((p ?? []).map((pt: any) => pt.character_id).filter(Boolean))];
    const { data: charData } = characterIds.length > 0
      ? await supabase.from("characters").select("id, name, level, vocation").in("id", characterIds)
      : { data: [] };
    const charMap = new Map((charData ?? []).map((ch: any) => [ch.id, ch]));

    const mapped = (p ?? []).map((pt: any) => ({
      ...pt,
      character: charMap.get(pt.character_id) ?? null,
    }));

    setBoss(b);
    setParticipants(mapped);
    setMyChars(c ?? []);
    setMyRole(prof?.role ?? "MEMBER");
    setLoading(false);

    if (b) {
      const creatorPart = mapped.find((p) => p.user_id === b.created_by);
      if (creatorPart?.character?.level) {
        setSharedRange(sharedExpRange(creatorPart.character.level));
      }
    }
  }

  async function handleJoin() {
    if (!joinCharId) return;
    const char = myChars.find((c) => c.id === joinCharId);
    if (!char) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: err } = await supabase.from("boss_participants").insert({
      boss_id: bossId,
      user_id: user.id,
      character_id: char.id,
    });

    if (err) {
      if (err.code === "23505") setError("Você já está neste boss.");
      else setError(err.message);
      return;
    }

    if (boss) {
      if (boss.rotation_group && boss.discord_message_id) {
        const { data: groupBosses } = await supabase.from("bosses").select("id, name, weekday, spawn_interval, max_participants, discord_message_id").eq("rotation_group", boss.rotation_group);
        const bossWithParts = await Promise.all(
          (groupBosses ?? []).map(async (b: any) => {
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
        notifyBossRotationUpdated({ messageId: boss.discord_message_id, bosses: bossWithParts });
      } else if (boss.discord_message_id) {
        const { data: updatedParts } = await supabase
          .from("boss_participants")
          .select("character_id")
          .eq("boss_id", bossId);

        const partIds = [...new Set((updatedParts ?? []).map((p: any) => p.character_id).filter(Boolean))];
        let participantNames: { name: string; vocation: string }[] = [];

        if (partIds.length > 0) {
          const { data: chars } = await supabase.from("characters").select("name, vocation").in("id", partIds);
          participantNames = (chars ?? []).map((c: any) => ({
            name: c.name,
            vocation: c.vocation,
          }));
        }

        notifyBossJoined({
          bossName: boss.name,
          bossId: bossId,
          messageId: boss.discord_message_id,
          maxParticipants: boss.max_participants || 0,
          weekday: boss.weekday,
          spawnInterval: boss.spawn_interval,
          isOfficial: boss.is_official,
          participants: participantNames,
        });
      }
    }

    setJoinCharId("");
    setJoinModalOpen(false);
    setError("");
    await loadBoss();
  }

  async function handleLeave(participantId: string) {
    await supabase.from("boss_participants").delete().eq("id", participantId);
    loadBoss();
  }

  async function handleMarkKill() {
    const now = new Date().toISOString();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("bosses").update({ last_killed_at: now }).eq("id", bossId);

    const myPart = participants.find((p) => p.user_id === user.id);
    if (myPart) {
      await supabase.from("boss_participants").update({ killed_at: now, confirmed: true }).eq("id", myPart.id);
    }

    loadBoss();
  }

  async function handleConfirm(participantId: string) {
    await supabase.from("boss_participants").update({ confirmed: true }).eq("id", participantId);
    loadBoss();
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "Nunca";
    return new Date(dateStr).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  const isAdmin = myRole === "LEADER" || myRole === "VICE";
  const isCreator = boss?.created_by === myUserId;
  const canManage = isAdmin || isCreator;
  const myParticipation = participants.find((p) => p.user_id === myUserId);

  if (loading || !boss) {
    return <div className="space-y-6 animate-pulse"><div className="h-8 w-48 bg-surface rounded" /><div className="h-64 bg-surface rounded-xl" /></div>;
  }

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted hover:text-foreground cursor-pointer">
        <ArrowLeft size={16} /> Voltar
      </button>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{boss.name}</h1>
            {boss.is_official && <Badge variant="danger">Oficial</Badge>}
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted">
            <span className="flex items-center gap-1"><Calendar size={14} />{WEEKDAYS[boss.weekday]}</span>
            <span className="flex items-center gap-1"><Clock size={14} />Spawn a cada {boss.spawn_interval} dias</span>
            {sharedRange && (
              <span className="flex items-center gap-1"><Shield size={14} />Shared: {sharedRange.min} – {sharedRange.max}</span>
            )}
          </div>
          {boss.notes && <p className="text-sm text-muted mt-2">{boss.notes}</p>}
        </div>

        <div className="flex gap-2">
          {!myParticipation && (
            <Button size="sm" onClick={() => { setJoinCharId(""); setError(""); setJoinModalOpen(true); }}>
              Participar
            </Button>
          )}
          {myParticipation && (
            <Button size="sm" variant="outline" onClick={handleMarkKill}>
              <Skull size={14} className="mr-1" /> Marquei Kill
            </Button>
          )}
        </div>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">{participants.length}</p>
            <p className="text-xs text-muted">Participantes</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-success">{participants.filter((p) => p.confirmed).length}</p>
            <p className="text-xs text-muted">Confirmados</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-muted">{formatDate(boss.last_killed_at)}</p>
            <p className="text-xs text-muted">Último Kill</p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Participantes ({participants.length})</CardTitle></CardHeader>
        {participants.length === 0 ? (
          <p className="text-sm text-muted p-2">Nenhum participante ainda.</p>
        ) : (
          <div className="space-y-1">
            {participants.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-hover">
                <div className="flex items-center gap-3">
                  <span className={p.character?.vocation ? VOCATIONS[p.character.vocation].color : "text-muted"}>
                    {p.character?.vocation ? VOCATIONS[p.character.vocation].short : "?"}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{p.character?.name ?? "..."}</p>
                    <p className="text-xs text-muted">{p.profile?.display_name ?? "..."} · Level {p.character?.level ?? "?"}</p>
                  </div>
                  {p.killed_at && (
                    <Badge variant="success">
                      <Skull size={10} className="mr-1" />Kill {new Date(p.killed_at).toLocaleDateString("pt-BR")}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {p.confirmed ? (
                    <Badge variant="success">Confirmado</Badge>
                  ) : (
                    <Badge variant="warning">Pendente</Badge>
                  )}
                  {(canManage || p.user_id === myUserId) && (
                    <button onClick={() => handleLeave(p.id)} className="p-1 rounded hover:bg-red-500/10 cursor-pointer">
                      <X size={14} className="text-red-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={joinModalOpen} onClose={() => setJoinModalOpen(false)} title="Participar do Boss">
        <div className="space-y-4">
          {myChars.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted mb-3">Você não tem personagens cadastrados.</p>
              <Button variant="outline" onClick={() => { setJoinModalOpen(false); router.push("/dashboard/profile"); }}>
                Cadastrar Personagem
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted">Escolha um personagem para participar:</p>
              {myChars.map((char) => (
                <Button
                  key={char.id}
                  variant={joinCharId === char.id ? "primary" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setJoinCharId(char.id)}
                >
                  <span className={VOCATIONS[char.vocation].color}>{VOCATIONS[char.vocation].short}</span>
                  <span className="mx-2">{char.name}</span>
                  <span className="text-muted text-xs ml-auto">Level {char.level}</span>
                </Button>
              ))}
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                  {error}
                </div>
              )}
              <Button onClick={handleJoin} className="w-full" disabled={!joinCharId}>
                Confirmar Participação
              </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
