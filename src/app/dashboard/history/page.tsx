"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VOCATIONS, type Vocation } from "@/lib/utils";
import { History, Skull, Swords, Coins, User, Clock } from "lucide-react";

export default function HistoryPage() {
  const [tab, setTab] = useState<"hunts" | "bosses" | "loot">("hunts");
  const [hunts, setHunts] = useState<any[]>([]);
  const [bosses, setBosses] = useState<any[]>([]);
  const [loot, setLoot] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => { loadHistory(); }, [tab]);

  async function loadHistory() {
    setLoading(true);
    const [
      { data: huntsData },
      { data: bossesData },
      { data: lootData },
    ] = await Promise.all([
      supabase
        .from("hunts")
        .select("id, name, scheduled_at, created_at, status, hunt_type")
        .in("status", ["completed", "cancelled"])
        .order("scheduled_at", { ascending: false })
        .limit(30),
      supabase
        .from("bosses")
        .select("id, name, last_killed_at, is_official")
        .not("last_killed_at", "is", null)
        .order("last_killed_at", { ascending: false })
        .limit(30),
      supabase
        .from("loot_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    const allHuntIds = new Set<string>();
    (huntsData ?? []).forEach((h: any) => allHuntIds.add(h.id));
    (lootData ?? []).forEach((l: any) => { if (l.hunt_id) allHuntIds.add(l.hunt_id); });

    const huntIdsArr = [...allHuntIds];
    const { data: allParts } = huntIdsArr.length > 0
      ? await supabase.from("hunt_participants").select("hunt_id, user_id, character_id, vocation_slot").in("hunt_id", huntIdsArr)
      : { data: [] };

    const allCharIds = [...new Set((allParts ?? []).map((p: any) => p.character_id).filter(Boolean))];
    const { data: allChars } = allCharIds.length > 0
      ? await supabase.from("characters").select("id, name, vocation").in("id", allCharIds)
      : { data: [] };
    const charMap = new Map((allChars ?? []).map((c: any) => [c.id, c]));

    const partsByHunt = new Map<string, any[]>();
    (allParts ?? []).forEach((p: any) => {
      if (!partsByHunt.has(p.hunt_id)) partsByHunt.set(p.hunt_id, []);
      partsByHunt.get(p.hunt_id)!.push({ user_id: p.user_id, character: charMap.get(p.character_id) ?? null });
    });

    const huntMap = new Map<string, any>();
    (huntsData ?? []).forEach((h: any) => huntMap.set(h.id, h));

    if (huntsData && huntsData.length > 0) {
      setHunts(huntsData.map((h: any) => ({
        ...h,
        participants: partsByHunt.get(h.id) ?? [],
      })));
    } else {
      setHunts([]);
    }

    const enrichedLoot = (lootData ?? []).map((l: any) => {
      const hunt = l.hunt_id ? huntMap.get(l.hunt_id) : null;
      return {
        ...l,
        hunt,
        participants: l.hunt_id ? (partsByHunt.get(l.hunt_id) ?? []) : [],
        duration: hunt ? getDuration(hunt.scheduled_at, l.created_at) : null,
      };
    });

    setBosses(bossesData ?? []);
    setLoot(enrichedLoot);
    setLoading(false);
  }

  function getDuration(start: string, end: string) {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (ms < 0) return null;
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes}min`;
  }

  function fmt(d: string) {
    return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  if (loading) return <div className="space-y-6 animate-pulse"><div className="h-8 w-48 bg-surface rounded" /><div className="h-64 bg-surface rounded-xl" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Histórico</h1>
        <p className="text-muted mt-1">Registro de atividades concluídas</p>
      </div>

      <div className="flex gap-2 border-b border-border pb-2">
        {[
          { key: "hunts" as const, label: "Hunts", icon: Swords },
          { key: "bosses" as const, label: "Bosses", icon: Skull },
          { key: "loot" as const, label: "Loot", icon: Coins },
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

      {tab === "hunts" && (
        <div className="space-y-3">
          {hunts.length === 0 ? (
            <Card><p className="text-sm text-muted text-center py-8">Nenhuma hunt concluída.</p></Card>
          ) : (
            hunts.map((h) => (
              <Card key={h.id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{h.name}</h3>
                      <Badge variant={h.status === "completed" ? "success" : "danger"}>
                        {h.status === "completed" ? "Concluída" : "Cancelada"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted mt-1"><Clock size={12} className="inline mr-1" />{fmt(h.scheduled_at)}</p>
                  </div>
                </div>
                {h.participants && h.participants.length > 0 && (
                  <div>
                    <p className="text-xs text-muted mb-1">Participantes ({h.participants.length}):</p>
                    <div className="flex flex-wrap gap-1">
                      {h.participants.map((p: any, i: number) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded bg-surface-hover">
                        <span className={p.character?.vocation ? VOCATIONS[p.character.vocation as Vocation]?.color : "text-muted"}>
                          {p.character?.vocation ?? "?"}
                          </span>{" "}
                          {p.character?.name ?? p.profile?.display_name ?? "?"}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {tab === "bosses" && (
        <div className="space-y-3">
          {bosses.length === 0 ? (
            <Card><p className="text-sm text-muted text-center py-8">Nenhum boss morto ainda.</p></Card>
          ) : (
            bosses.map((b) => (
              <Card key={b.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skull size={16} className="text-yellow-400" />
                    <span className="font-medium">{b.name}</span>
                    {b.is_official && <Badge variant="danger">Oficial</Badge>}
                  </div>
                  <span className="text-sm text-muted">
                    Último kill: {b.last_killed_at ? fmt(b.last_killed_at) : "—"}
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === "loot" && (
        <div className="space-y-3">
          {loot.length === 0 ? (
            <Card><p className="text-sm text-muted text-center py-8">Nenhum loot registrado.</p></Card>
          ) : (
            loot.map((item: any) => {
              const rawSplits = item.split_among ?? [];
              const splits: { user_id: string; amount: number }[] = rawSplits.map((s: any) =>
                typeof s === "string" ? { user_id: s, amount: 0 } : s
              );
              const participants = item.participants ?? [];
              return (
                <Card key={item.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium">
                        {item.hunt?.name ?? (item.hunt_id ? "Hunt" : item.boss_id ? "Boss" : "Geral")}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <span>{fmt(item.created_at)}</span>
                        {item.duration && <span>· ⏱️ {item.duration}</span>}
                      </div>
                    </div>
                    <Badge variant="warning">{item.value.toLocaleString("pt-BR")} gp</Badge>
                  </div>
                  {participants.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2 text-xs text-muted">
                      <span className="text-muted">Participantes: </span>
                      {participants.map((p: any, i: number) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-surface-hover">
                          <span className={p.character?.vocation ? VOCATIONS[p.character.vocation as Vocation]?.color : ""}>
                            {p.character?.vocation ?? "?"}
                          </span>{" "}
                          {p.character?.name ?? "?"}
                        </span>
                      ))}
                    </div>
                  )}
                  {splits.length > 0 && (
                    <div className="space-y-0.5 border-t border-border pt-2">
                      {splits.map((s: any) => {
                        const p = participants.find((pt: any) => pt.user_id === s.user_id);
                        return (
                          <div key={s.user_id} className="flex items-center justify-between text-xs">
                            <span>
                              <span className={p?.character?.vocation ? VOCATIONS[p.character.vocation as Vocation]?.color : "text-muted"}>
                                {p?.character?.vocation ?? "?"}
                              </span>{" "}
                              {p?.character?.name ?? s.user_id?.substring(0, 8) ?? "?"}
                            </span>
                            <span className={s.amount > 0 ? "text-muted" : "text-muted/50"}>
                              {s.amount > 0 ? `${s.amount.toLocaleString("pt-BR")} gp` : "—"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
