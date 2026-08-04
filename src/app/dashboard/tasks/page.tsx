"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { VOCATIONS, type Vocation } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Shield, Clock, Lock, Check, Plus, Swords } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { notifyTaskCreated } from "@/lib/discord";

interface Task {
  id: string;
  creature: string;
  location: string;
  scheduled_at: string;
  hunt_type: "solo" | "group";
  status: string;
  slots: Record<Vocation, number>;
  created_by: string;
  notes: string | null;
}

const TASK_STATUS: Record<string, string> = {
  open: "Aberta",
  full: "Lotada",
  completed: "Concluída",
  cancelled: "Cancelada",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "solo" | "group">("all");
  const [myRole, setMyRole] = useState("MEMBER");

  const [modalOpen, setModalOpen] = useState(false);
  const [formCreature, setFormCreature] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formScheduledAt, setFormScheduledAt] = useState("");
  const [formHuntType, setFormHuntType] = useState<"solo" | "group">("group");
  const [formSlots, setFormSlots] = useState<Record<Vocation, number>>({ EK: 1, RP: 2, MS: 1, ED: 1, MK: 1 });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => { loadTasks(); }, []);

  async function loadTasks() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: taskData }, { data: profile }] = await Promise.all([
      supabase.from("tasks").select("*").order("scheduled_at"),
      supabase.from("profiles").select("role").eq("id", user.id).single(),
    ]);

    setTasks(taskData ?? []);
    setMyRole(profile?.role ?? "MEMBER");
    setLoading(false);
  }

  async function handleCreate() {
    if (!formCreature.trim()) { setFormError("Informe a criatura."); return; }
    if (!formLocation.trim()) { setFormError("Informe o local."); return; }
    if (!formScheduledAt) { setFormError("Informe a data."); return; }

    setSaving(true);
    setFormError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const scheduledAt = new Date(formScheduledAt).toISOString();

    const { data: newTask, error } = await supabase.from("tasks").insert({
      created_by: user.id,
      creature: formCreature.trim(),
      location: formLocation.trim(),
      scheduled_at: scheduledAt,
      hunt_type: formHuntType,
      slots: formHuntType === "solo" ? { EK: 0, RP: 0, MS: 0, ED: 0, MK: 0 } : formSlots,
    }).select("id").single();

    if (error || !newTask) { setFormError(error?.message || "Erro ao criar task."); setSaving(false); return; }

    const { data: myChars } = await supabase.from("characters").select("id,name,vocation,level").eq("user_id", user.id).limit(1).maybeSingle();
    if (myChars) {
      await supabase.from("task_participants").insert({
        task_id: newTask.id,
        user_id: user.id,
        character_id: myChars.id,
        vocation_slot: myChars.vocation,
        confirmed: true,
        is_waiting: false,
      });
    }

    const { data: creatorChar } = await supabase.from("characters").select("id,name,vocation,level").eq("user_id", user.id).limit(1).maybeSingle();

    const messageId = await notifyTaskCreated({
      creature: formCreature.trim(),
      location: formLocation.trim(),
      taskId: newTask.id,
      scheduledAt: scheduledAt,
      taskType: formHuntType,
      creatorName: creatorChar?.name ?? user.email ?? "Desconhecido",
      creatorVocation: creatorChar?.vocation ?? "?",
      creatorLevel: creatorChar?.level ?? 0,
      slots: formHuntType === "solo" ? {} : formSlots,
    });

    if (messageId) {
      await supabase.from("tasks").update({ discord_message_id: messageId }).eq("id", newTask.id);
    }

    setModalOpen(false);
    setFormCreature("");
    setFormLocation("");
    setFormScheduledAt("");
    setSaving(false);
    loadTasks();
  }

  const isAdmin = myRole === "LEADER" || myRole === "VICE";

  if (loading) {
    return <div className="space-y-6 animate-pulse"><div className="h-8 w-48 bg-surface rounded" /><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-surface rounded-xl" />)}</div></div>;
  }

  const filtered = tasks.filter((t) => filterType === "all" || t.hunt_type === filterType)
    .filter((t) => t.status === "open" || t.status === "full");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-muted mt-1">Tasks de criaturas da guilda</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setFormError(""); setModalOpen(true); }}>
            <Plus size={16} /> Criar Task
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        {(["all", "solo", "group"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={cn("px-3 py-1 text-sm rounded-md cursor-pointer", filterType === t ? "bg-primary/10 text-primary" : "text-muted hover:bg-surface-hover")}
          >
            {t === "all" ? "Todas" : t === "solo" ? "Solo" : "PT Aberta"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <Card className="md:col-span-2">
            <p className="text-sm text-muted text-center py-8">Nenhuma task disponível.</p>
          </Card>
        ) : (
          filtered.map((task) => (
            <Link key={task.id} href={`/dashboard/tasks/${task.id}`} className="block">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold hover:text-primary transition-colors">{task.creature}</span>
                      {task.hunt_type === "solo" && <Badge variant="default"><Lock size={12} className="inline mr-1" />Solo</Badge>}
                      <Badge variant={task.status === "open" ? "success" : "warning"}>
                        {TASK_STATUS[task.status] ?? task.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted mt-1">
                      <Swords size={12} className="inline mr-1" />{task.location}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      <Clock size={12} className="inline mr-1" />
                      {new Date(task.scheduled_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
            </Link>
          ))
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Criar Task">
        <div className="space-y-4">
          <Input label="Criatura" value={formCreature} onChange={(e) => setFormCreature(e.target.value)} placeholder="Ex: Dragon Lord" />
          <Input label="Local" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} placeholder="Ex: Venore Dragon Lair" />
          <Input label="Data e Hora" type="datetime-local" value={formScheduledAt} onChange={(e) => setFormScheduledAt(e.target.value)} />
          <Select label="Tipo" value={formHuntType} onChange={(e) => setFormHuntType(e.target.value as "solo" | "group")}
            options={[{ value: "group", label: "PT Aberta" }, { value: "solo", label: "Solo" }]} />
          {formHuntType === "group" && (
            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(VOCATIONS) as Vocation[]).map((voc) => (
                <div key={voc}>
                  <label className="text-xs text-muted">{voc}</label>
                  <input type="number" min="0" value={formSlots[voc]} onChange={(e) => setFormSlots((p) => ({ ...p, [voc]: Number(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 rounded border border-border bg-background text-foreground text-sm text-center" />
                </div>
              ))}
            </div>
          )}
          {formError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">{formError}</div>}
          <Button onClick={handleCreate} className="w-full" disabled={saving}>{saving ? "Criando..." : "Criar Task"}</Button>
        </div>
      </Modal>
    </div>
  );
}
