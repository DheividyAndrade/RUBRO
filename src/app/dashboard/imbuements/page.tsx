"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IMBUEMENTS } from "@/lib/imbuements";
import { FlaskRound, Search, Coins, Clock, ChevronDown, ChevronUp } from "lucide-react";

const SLOTS = ["Helmet", "Armor", "Shield"];

const WIKI_ITEM_IMG = (name: string) =>
  `https://www.tibiawiki.com.br/wiki/Especial:Redirecionar?file=${encodeURIComponent(name)}.gif`;

export default function ImbuementsPage() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [slotFilter, setSlotFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = IMBUEMENTS;
    if (slotFilter) list = list.filter((i) => i.slot === slotFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.effect.toLowerCase().includes(q) ||
          i.items.some((it) => it.name.toLowerCase().includes(q))
      );
    }
    return list;
  }, [search, slotFilter]);

  const groupedBySlot = useMemo(() => {
    const groups: Record<string, typeof IMBUEMENTS> = {};
    filtered.forEach((i) => {
      if (!groups[i.slot]) groups[i.slot] = [];
      groups[i.slot].push(i);
    });
    return groups;
  }, [filtered]);

  const tierVariant = (tier: string) => {
    if (tier === "Basic") return "success";
    if (tier === "Intricate") return "warning";
    return "danger";
  };

  const slotIcon = (slot: string) => {
    if (slot === "Helmet") return "🪖";
    if (slot === "Armor") return "🛡️";
    return "🔰";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Imbuements</h1>
        <p className="text-muted mt-1">Itens necessários para cada imbuement</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar imbuement ou item..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-surface text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {[null, ...SLOTS].map((slot) => (
            <button
              key={slot ?? "all"}
              onClick={() => setSlotFilter(slot)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                slotFilter === slot
                  ? "bg-primary/20 text-primary"
                  : "bg-surface-hover text-muted hover:text-foreground"
              }`}
            >
              {slot ? `${slotIcon(slot)} ${slot}` : "Todos"}
            </button>
          ))}
        </div>
      </div>

      {Object.entries(groupedBySlot).map(([slot, items]) => (
        <div key={slot} className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {slotIcon(slot)} {slot}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((imbu) => (
              <Card key={imbu.id} className="hover:border-primary/30 transition-colors">
                <div
                  className="cursor-pointer"
                  onClick={() => setExpanded(expanded === imbu.id ? null : imbu.id)}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <img
                      src={imbu.icon}
                      alt={imbu.name}
                      className="w-12 h-12 rounded object-contain bg-surface-hover flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold">{imbu.name}</h3>
                        <Badge variant={tierVariant(imbu.tier)}>{imbu.tier}</Badge>
                      </div>
                      <p className="text-xs text-muted mt-1 line-clamp-2">{imbu.effect}</p>
                    </div>
                    <button className="p-1 rounded hover:bg-surface-hover cursor-pointer flex-shrink-0">
                      {expanded === imbu.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted mt-2 pt-2 border-t border-border/50">
                  <span className="flex items-center gap-1">
                    <Coins size={12} /> {imbu.cost.toLocaleString("pt-BR")} gp
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {imbu.time}
                  </span>
                </div>

                {expanded === imbu.id && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs text-muted mb-2">Itens necessários:</p>
                    <div className="space-y-2">
                      {imbu.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <img
                            src={WIKI_ITEM_IMG(item.name)}
                            alt={item.name}
                            className="w-8 h-8 rounded object-contain bg-surface-hover flex-shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                          <div className="flex-1 flex items-center justify-between min-w-0">
                            <span className="text-xs truncate">{item.name}</span>
                            <Badge variant="default" className="flex-shrink-0">{item.quantity}x</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-2 rounded-lg bg-surface-hover">
                      <p className="text-xs text-muted">
                        <strong>Total de itens:</strong> {imbu.items.reduce((sum, it) => sum + it.quantity, 0)} unidades
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <Card>
          <p className="text-sm text-muted text-center py-8">
            Nenhum imbuement encontrado para "{search}".
          </p>
        </Card>
      )}
    </div>
  );
}
