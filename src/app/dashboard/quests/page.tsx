"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { VOCATIONS, type Vocation } from "@/lib/utils";
import { ScrollText, Plus, Shield, Users, Check, X } from "lucide-react";
import Link from "next/link";

interface Quest {
  id: string;
  name: string;
  description: string | null;
  min_level: number;
  requirements: string[];
  status: string;
  slots: { EK: number; RP: number; MS: number; ED: number };
  participants: { user_id: string; character_id: string }[];
}

const DEFAULT_SLOTS: Record<Vocation, number> = { EK: 1, RP: 2, MS: 1, ED: 1, MK: 1 };

export default function QuestsPage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [canCreate, setCanCreate] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formMinLevel, setFormMinLevel] = useState("0");
  const [formRequirements, setFormRequirements] = useState("");
  const [formSlots, setFormSlots] = useState(DEFAULT_SLOTS);

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: questsData }, { data: profile }] = await Promise.all([
      supabase
        .from("quests")
        .select("*, participants:quest_participants(user_id, character_id)")
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("role").eq("id", user.id).single(),
    ]);

    setQuests(questsData ?? []);
    setCanCreate(profile?.role === "LEADER" || profile?.role === "VICE");
    setLoading(false);
  }

  async function handleCreate() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !formName) return;

    const reqs = formRequirements
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    await supabase.from("quests").insert({
      created_by: user.id,
      name: formName,
      description: formDescription || null,
      min_level: Number(formMinLevel) || 0,
      requirements: reqs,
      slots: formSlots,
    });

    setModalOpen(false);
    setFormName("");
    setFormDescription("");
    setFormMinLevel("0");
    setFormRequirements("");
    setFormSlots(DEFAULT_SLOTS);
    loadData();
  }

  async function handleToggleJoin(quest: Quest) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existing } = await supabase
      .from("quest_participants")
      .select("id")
      .eq("quest_id", quest.id)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      await supabase.from("quest_participants").delete().eq("id", existing.id);
    } else {
      const { data: chars } = await supabase
        .from("characters")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (chars) {
        await supabase.from("quest_participants").insert({
          quest_id: quest.id,
          user_id: user.id,
          character_id: chars.id,
        });
      }
    }
    loadData();
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-surface rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-surface rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quests</h1>
          <p className="text-muted mt-1">Acompanhe e participe das quests da guilda</p>
        </div>
        {canCreate && (
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} />
            Criar Quest
          </Button>
        )}
      </div>

      {quests.length === 0 ? (
        <Card>
          <p className="text-sm text-muted text-center py-8">
            Nenhuma quest cadastrada.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quests.map((quest) => {
            const slots = (quest.slots || DEFAULT_SLOTS) as typeof DEFAULT_SLOTS;
            return (
              <Card key={quest.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{quest.name}</h3>
                    {quest.description && (
                      <p className="text-sm text-muted mt-1">
                        {quest.description}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      quest.status === "open"
                        ? "success"
                        : quest.status === "in_progress"
                        ? "warning"
                        : quest.status === "completed"
                        ? "info"
                        : "danger"
                    }
                  >
                    {quest.status === "open"
                      ? "Aberta"
                      : quest.status === "in_progress"
                      ? "Em andamento"
                      : quest.status === "completed"
                      ? "Concluída"
                      : "Cancelada"}
                  </Badge>
                </div>

                {quest.min_level > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted">
                    <Shield size={12} />
                    Level {quest.min_level}+
                  </div>
                )}

                {(quest.requirements as string[])?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted mb-1">Requisitos:</p>
                    {(quest.requirements as string[]).map((req, i) => (
                      <div key={i} className="flex items-center gap-1 text-xs">
                        <span className="text-success">&#x2714;</span>
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3 mt-3 text-xs">
                  {(Object.keys(DEFAULT_SLOTS) as Vocation[]).map((voc) => (
                    <div key={voc} className="flex items-center gap-1">
                      <span className={VOCATIONS[voc].color}>
                        {VOCATIONS[voc].short}
                      </span>
                      <span className="text-muted">
                        ({quest.participants?.length ?? 0}/{slots[voc] ?? 0})
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => handleToggleJoin(quest)}>
                    Participar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Criar Quest"
        className="max-w-lg"
      >
        <div className="space-y-4">
          <Input
            label="Nome da Quest"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Soul War"
          />
          <Input
            label="Descrição"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            placeholder="Breve descrição"
          />
          <Input
            label="Level Mínimo"
            type="number"
            value={formMinLevel}
            onChange={(e) => setFormMinLevel(e.target.value)}
            placeholder="250"
          />
          <Input
            label="Requisitos (separados por vírgula)"
            value={formRequirements}
            onChange={(e) => setFormRequirements(e.target.value)}
            placeholder="Access Soul War, 250+"
          />
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Vagas
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(DEFAULT_SLOTS) as Vocation[]).map((voc) => (
                <div key={voc}>
                  <label className={`block text-xs mb-1 ${VOCATIONS[voc].color}`}>
                    {VOCATIONS[voc].short}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={formSlots[voc]}
                    onChange={(e) =>
                      setFormSlots((prev) => ({
                        ...prev,
                        [voc]: Number(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              ))}
            </div>
          </div>
          <Button onClick={handleCreate} className="w-full">
            Criar Quest
          </Button>
        </div>
      </Modal>
    </div>
  );
}
