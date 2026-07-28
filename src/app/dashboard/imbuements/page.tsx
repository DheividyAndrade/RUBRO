"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IMBUEMENTS } from "@/lib/imbuements";
import { Search, Coins, Clock, ChevronDown, ChevronUp, Swords, Shield, Sparkles, Zap, Flame, Snowflake, Skull, Gem, Heart, Droplets, Leaf, Sun } from "lucide-react";

const SLOTS = ["Helmet", "Armor", "Shield"];

const CATEGORY_ICONS: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  "Mana Leech": { icon: Zap, color: "text-blue-400", label: "Mana Leech" },
  "Life Leech": { icon: Heart, color: "text-red-400", label: "Life Leech" },
  "Critical": { icon: Swords, color: "text-yellow-400", label: "Critical" },
  "Distance": { icon: Sparkles, color: "text-orange-400", label: "Distance" },
  "Magic Level": { icon: Sparkles, color: "text-purple-400", label: "Magic Level" },
  "Sword": { icon: Swords, color: "text-sky-400", label: "Sword" },
  "Axe": { icon: Swords, color: "text-rose-400", label: "Axe" },
  "Club": { icon: Swords, color: "text-amber-400", label: "Club" },
  "Fist": { icon: Swords, color: "text-orange-400", label: "Fist" },
  "Shielding": { icon: Shield, color: "text-emerald-400", label: "Shielding" },
  "Death Protection": { icon: Skull, color: "text-gray-400", label: "Death" },
  "Fire Protection": { icon: Flame, color: "text-red-500", label: "Fire" },
  "Energy Protection": { icon: Zap, color: "text-blue-500", label: "Energy" },
  "Ice Protection": { icon: Snowflake, color: "text-cyan-400", label: "Ice" },
  "Earth Protection": { icon: Leaf, color: "text-green-500", label: "Earth" },
  "Holy Protection": { icon: Sun, color: "text-yellow-300", label: "Holy" },
  "Energy Damage": { icon: Zap, color: "text-blue-400", label: "Energy Dmg" },
  "Ice Damage": { icon: Snowflake, color: "text-cyan-400", label: "Ice Dmg" },
  "Death Damage": { icon: Skull, color: "text-gray-400", label: "Death Dmg" },
  "Fire Damage": { icon: Flame, color: "text-red-500", label: "Fire Dmg" },
  "Earth Damage": { icon: Leaf, color: "text-green-500", label: "Earth Dmg" },
};

export default function ImbuementsPage() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [slotFilter, setSlotFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(IMBUEMENTS.map((i) => i.category));
    return Array.from(cats).sort();
  }, []);

  const filtered = useMemo(() => {
    let list = IMBUEMENTS;
    if (slotFilter) list = list.filter((i) => i.slot === slotFilter);
    if (categoryFilter) list = list.filter((i) => i.category === categoryFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.effect.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.items.some((it) => it.name.toLowerCase().includes(q))
      );
    }
    return list;
  }, [search, slotFilter, categoryFilter]);

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

  const slotIcon = (s: string) => {
    if (s === "Helmet") return "🪖";
    if (s === "Armor") return "🛡️";
    return "🔰";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Imbuements</h1>
        <p className="text-muted mt-1">Itens necessários para cada imbuement — dados do Tibia Wiki</p>
      </div>

      <div className="space-y-3">
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
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted mr-1 mt-1">Slot:</span>
          {[null, ...SLOTS].map((slot) => (
            <button
              key={slot ?? "all"}
              onClick={() => setSlotFilter(slot)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                slotFilter === slot ? "bg-primary/20 text-primary" : "bg-surface-hover text-muted hover:text-foreground"
              }`}
            >
              {slot ? `${slotIcon(slot)} ${slot}` : "Todos"}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-muted mr-1 mt-1">Categoria:</span>
          {categories.slice(0, 15).map((cat) => {
            const info = CATEGORY_ICONS[cat];
            const Icon = info?.icon;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                className={`px-2 py-1 rounded-lg text-xs transition-colors cursor-pointer inline-flex items-center gap-1 ${
                  categoryFilter === cat ? "bg-primary/20 text-primary" : "bg-surface-hover text-muted hover:text-foreground"
                }`}
              >
                {Icon && <Icon size={12} className={info?.color} />}
                {info?.label ?? cat}
              </button>
            );
          })}
        </div>
      </div>

      {Object.entries(groupedBySlot).map(([slot, items]) => (
        <div key={slot} className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {slotIcon(slot)} {slot}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-3">
            {items.map((imbu) => {
              const info = CATEGORY_ICONS[imbu.category];
              const Icon = info?.icon;
              return (
                <Card key={imbu.id} className="hover:border-primary/30 transition-colors h-fit mb-3">
                <div onClick={(e) => { e.stopPropagation(); setExpanded(expanded === imbu.id ? null : imbu.id); }} className="cursor-pointer">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="flex-shrink-0">
                        {imbu.icon ? (
                          <img
                            src={imbu.icon}
                            alt={imbu.name}
                            className="w-10 h-10 rounded object-contain bg-surface-hover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                              (e.target as HTMLImageElement).parentElement!.querySelector(".fallback")?.classList.remove("hidden");
                            }}
                          />
                        ) : null}
                        <div className={`fallback ${imbu.icon ? "hidden" : ""} p-2 rounded-lg bg-surface-hover ${info?.color}`}>
                          {Icon && <Icon size={22} />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold">{imbu.name}</h3>
                          <Badge variant={tierVariant(imbu.tier)}>{imbu.tier}</Badge>
                        </div>
                        <p className="text-xs text-muted mt-1">{imbu.effect}</p>
                      </div>
                      <button className="p-1 rounded hover:bg-surface-hover cursor-pointer flex-shrink-0">
                        {expanded === imbu.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted mt-2 pt-2 border-t border-border/50">
                    <span className="flex items-center gap-1"><Coins size={12} /> {imbu.cost.toLocaleString("pt-BR")} gp</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {imbu.time}</span>
                  </div>

                  {expanded === imbu.id && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-xs text-muted mb-2">Itens necessários:</p>
                      <div className="space-y-1.5">
                        {imbu.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded bg-surface-hover">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                                {imbu.folder ? (
                                  <img
                                    src={`/imbuements/${imbu.folder}/${item.name.replace(/'/g, "%27").replace(/ /g, "_")}.gif`}
                                    alt={item.name}
                                    className="w-6 h-6 object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = "none";
                                      (e.target as HTMLImageElement).parentElement!.querySelector(".dot")?.classList.remove("hidden");
                                    }}
                                  />
                                ) : null}
                                <div className={`dot ${imbu.folder ? "hidden" : ""} w-2.5 h-2.5 rounded-full flex-shrink-0 ${info?.color ?? "bg-primary/50"} opacity-60 ring-1 ring-inset ring-white/10`} />
                              </div>
                              <span className="truncate">{item.name}</span>
                            </div>
                            <Badge variant="default">{item.quantity}x</Badge>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 p-2 rounded-lg bg-surface-hover">
                        <p className="text-xs text-muted">
                          <strong>Total:</strong> {imbu.items.reduce((sum, it) => sum + it.quantity, 0)} itens
                        </p>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <Card>
          <p className="text-sm text-muted text-center py-8">Nenhum imbuement encontrado.</p>
        </Card>
      )}
    </div>
  );
}
