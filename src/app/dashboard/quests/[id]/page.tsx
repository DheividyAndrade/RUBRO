"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { VOCATIONS, type Vocation } from "@/lib/utils";
import { ScrollText, Shield, User, ArrowLeft, Check, X } from "lucide-react";

interface Quest {
  id: string;
  name: string;
  description: string | null;
  min_level: number;
  requirements: string[];
  status: string;
  slots: { EK: number; RP: number; MS: number; ED: number };
  created_by: string;
}

interface Participant {
  id: string;
  user_id: string;
  character_id: string;
  confirmed: boolean;
  character: { name: string; level: number; vocation: Vocation };
  profile: { display_name: string; role: string };
}

const DEFAULT_SLOTS: Record<Vocation, number> = { EK: 1, RP: 2, MS: 1, ED: 1, MK: 1 };

export default function QuestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const questId = params.id as string;

  const [quest, setQuest] = useState<Quest | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [myChars, setMyChars] = useState<{ id: string; name: string; vocation: Vocation; level: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    loadQuest();
  }, [questId]);

  async function loadQuest() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: questData }, { data: participantsData }, { data: charsData }] =
      await Promise.all([
        supabase.from("quests").select("*").eq("id", questId).single(),
        supabase
          .from("quest_participants")
          .select("*, character:characters(name, level, vocation), profile:profiles(display_name, role)")
          .eq("quest_id", questId),
        supabase.from("characters").select("id, name, vocation, level").eq("user_id", user.id),
      ]);

    setQuest(questData);
    setParticipants(participantsData ?? []);
    setMyChars(charsData ?? []);
    setLoading(false);
  }

  async function handleJoin(charId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("quest_participants").insert({
      quest_id: questId,
      user_id: user.id,
      character_id: charId,
    });
    loadQuest();
  }

  async function handleLeave(participantId: string) {
    await supabase.from("quest_participants").delete().eq("id", participantId);
    loadQuest();
  }

  async function handleConfirm(participantId: string) {
    await supabase
      .from("quest_participants")
      .update({ confirmed: true })
      .eq("id", participantId);
    loadQuest();
  }

  if (loading || !quest) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-surface rounded" />
        <div className="h-64 bg-surface rounded-xl" />
      </div>
    );
  }

  const slots = (quest.slots as Record<Vocation, number>) ?? DEFAULT_SLOTS;

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{quest.name}</h1>
          <Badge
            variant={
              quest.status === "open" ? "success" : quest.status === "in_progress" ? "warning" : "danger"
            }
          >
            {quest.status === "open" ? "Aberta" : quest.status === "in_progress" ? "Em andamento" : quest.status}
          </Badge>
        </div>
        {quest.description && (
          <p className="text-sm text-muted mt-2">{quest.description}</p>
        )}
      </div>

      {(quest.requirements as string[])?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Requisitos</CardTitle>
          </CardHeader>
          <div className="space-y-1">
            {quest.min_level > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Shield size={14} className="text-muted" />
                <span>Level {quest.min_level}+</span>
              </div>
            )}
            {(quest.requirements as string[]).map((req, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Check size={14} className="text-success" />
                <span>{req}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(Object.keys(DEFAULT_SLOTS) as Vocation[]).map((voc) => {
          const inSlot = participants.filter((p) => {
            return p.character?.vocation === voc;
          });
          const maxSlot = slots[voc] || 0;

          return (
            <Card key={voc}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-lg ${VOCATIONS[voc].color}`}>
                      {VOCATIONS[voc].short}
                    </span>
                    <span className="text-sm text-muted">
                      ({inSlot.length}/{maxSlot})
                    </span>
                  </div>
                </div>
              </CardHeader>
              {inSlot.length === 0 ? (
                <p className="text-sm text-muted px-2 pb-4">Vaga disponível</p>
              ) : (
                <div className="space-y-2 px-2 pb-4">
                  {inSlot.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-surface-hover"
                    >
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-muted" />
                        <div>
                          <p className="text-sm font-medium">{p.character?.name}</p>
                          <p className="text-xs text-muted">
                            {p.profile?.display_name} · Level {p.character?.level}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {p.confirmed ? (
                          <Badge variant="success">Confirmado</Badge>
                        ) : (
                          <button
                            onClick={() => handleConfirm(p.id)}
                            className="p-1 rounded hover:bg-success/20 cursor-pointer"
                          >
                            <Check size={14} className="text-success" />
                          </button>
                        )}
                        <button
                          onClick={() => handleLeave(p.id)}
                          className="p-1 rounded hover:bg-red-500/10 cursor-pointer"
                        >
                          <X size={14} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {myChars.length > 0 && !participants.some((p) => {
        // Check if user is already participating
        const check = async () => {
          const { data } = await supabase.auth.getUser();
          return p.user_id === data.user?.id;
        };
        return false; // Simplified — in real app would track this
      }) && (
        <Card>
          <CardHeader>
            <CardTitle>Participar</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted">Escolha um personagem para participar:</p>
            {myChars.map((char) => (
              <Button
                key={char.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleJoin(char.id)}
              >
                <span className={VOCATIONS[char.vocation].color}>
                  {VOCATIONS[char.vocation].short}
                </span>
                <span className="mx-2">{char.name}</span>
                <span className="text-muted text-xs">Level {char.level}</span>
              </Button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
