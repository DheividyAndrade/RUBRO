"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

export default function RankingPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const res = await fetch("/api/coins");
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      const items = data.leaderboard || [];

      const userIds = items.map((e: any) => e.user_id);
      if (userIds.length === 0) { setLeaderboard([]); setLoading(false); return; }

      const { data: chars } = await supabase
        .from("characters")
        .select("user_id, name, level")
        .in("user_id", userIds)
        .eq("is_main", true);

      const charMap = new Map<string, { name: string; level: number }>();
      (chars ?? []).forEach((c: any) => charMap.set(c.user_id, { name: c.name, level: c.level }));

      setLeaderboard(items.map((e: any, i: number) => ({
        ...e,
        rank: i + 1,
        main_character: charMap.get(e.user_id)?.name || null,
        main_level: charMap.get(e.user_id)?.level || 0,
      })));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="space-y-6 animate-pulse"><div className="h-8 w-48 bg-surface rounded" /><div className="h-64 bg-surface rounded-xl" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rank Guild</h1>
        <p className="text-muted mt-1">Ranking de membros por Rubro Coin 🪙</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <CardTitle>Top Membros</CardTitle>
          </div>
        </CardHeader>
        <div className="space-y-1">
          {leaderboard.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">Nenhum membro pontuou ainda.</p>
          ) : (
            leaderboard.map((entry: any) => (
              <div key={entry.user_id} className="flex items-center gap-4 p-3 rounded-lg bg-surface-hover">
                <div className="w-10 text-center">
                  {entry.rank === 1 ? <span className="text-2xl">🥇</span> :
                   entry.rank === 2 ? <span className="text-2xl">🥈</span> :
                   entry.rank === 3 ? <span className="text-2xl">🥉</span> :
                   <span className="text-lg font-bold text-muted">#{entry.rank}</span>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{entry.display_name}</p>
                    <Badge variant={entry.role === "LEADER" ? "danger" : entry.role === "VICE" ? "warning" : "default"} className="text-xs">
                      {entry.role === "LEADER" ? "Líder" : entry.role === "VICE" ? "Vice" : "Membro"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted">
                    Lv. Usuário {entry.user_level}
                    {entry.main_character && <span> · Main: {entry.main_character} (Lv. {entry.main_level})</span>}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary flex items-center gap-1 justify-end">
                    <img src="/rubro-coin.png" alt="" className="w-4 h-4" />
                    {entry.amount?.toLocaleString("pt-BR") || 0}
                  </p>
                  <p className="text-xs text-muted">Rubro Coins</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
