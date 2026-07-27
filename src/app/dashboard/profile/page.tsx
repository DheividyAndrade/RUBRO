"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { VOCATIONS, type Vocation } from "@/lib/utils";
import { Plus, Pencil, Trash2, Star, AlertCircle } from "lucide-react";

interface Character {
  id: string;
  name: string;
  vocation: Vocation;
  level: number;
  is_main: boolean;
  play_times: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<{ display_name: string; role: string } | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChar, setEditingChar] = useState<Character | null>(null);
  const [saving, setSaving] = useState(false);

  const [formName, setFormName] = useState("");
  const [formVocation, setFormVocation] = useState<Vocation>("EK");
  const [formLevel, setFormLevel] = useState("");
  const [formPlayTimes, setFormPlayTimes] = useState("");
  const [formIsMain, setFormIsMain] = useState(false);
  const [formError, setFormError] = useState("");

  const supabase = createClient();

  const loadData = useCallback(async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return;

    let { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("display_name, role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      const email = user.email ?? "membro";
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({ id: user.id, display_name: user.user_metadata?.display_name ?? email, role: "MEMBER" })
        .select("display_name, role")
        .single();
      if (!createError) profileData = newProfile;
    }

    const { data: chars } = await supabase
      .from("characters")
      .select("*")
      .eq("user_id", user.id)
      .order("is_main", { ascending: false })
      .order("level", { ascending: false });

    setProfile(profileData);
    setCharacters(chars ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  function openCreateModal() {
    setEditingChar(null);
    setFormName("");
    setFormVocation("EK");
    setFormLevel("");
    setFormPlayTimes("");
    setFormIsMain(false);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(char: Character) {
    setEditingChar(char);
    setFormName(char.name);
    setFormVocation(char.vocation);
    setFormLevel(String(char.level));
    setFormPlayTimes(char.play_times);
    setFormIsMain(char.is_main);
    setFormError("");
    setModalOpen(true);
  }

  async function handleSave() {
    if (!formName.trim()) { setFormError("Nome do personagem é obrigatório."); return; }
    setSaving(true);
    setFormError("");

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) { setFormError("Erro de autenticação."); setSaving(false); return; }

    const payload = {
      name: formName.trim(),
      vocation: formVocation,
      level: Number(formLevel) || 0,
      play_times: formPlayTimes,
      is_main: formIsMain,
    };

    if (formIsMain) {
      await supabase.from("characters").update({ is_main: false }).eq("user_id", user.id);
    }

    if (editingChar) {
      const { error } = await supabase.from("characters").update(payload).eq("id", editingChar.id);
      if (error) { setFormError(`Erro ao atualizar: ${error.message}`); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("characters").insert({ ...payload, user_id: user.id });
      if (error) { setFormError(`Erro ao criar: ${error.message}`); setSaving(false); return; }
    }

    setSaving(false);
    setModalOpen(false);
    loadData();
  }

  async function handleDelete(char: Character) {
    await supabase.from("characters").delete().eq("id", char.id);
    loadData();
  }

  async function handleSetMain(char: Character) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("characters").update({ is_main: false }).eq("user_id", user.id);
    await supabase.from("characters").update({ is_main: true }).eq("id", char.id);
    loadData();
  }

  if (loading) {
    return <div className="space-y-6 animate-pulse"><div className="h-8 w-48 bg-surface rounded" /><div className="h-32 bg-surface rounded-xl" /></div>;
  }

  const vocationOptions = [
    { value: "EK", label: "Elite Knight (EK) 🛡️" },
    { value: "RP", label: "Royal Paladin (RP) 🏹" },
    { value: "MS", label: "Master Sorcerer (MS) 🔥" },
    { value: "ED", label: "Elder Druid (ED) 🌿" },
    { value: "MK", label: "Monk (MK) 👊" },
  ];

  const badgeVariant = (voc: Vocation) => {
    const map: Record<Vocation, "info" | "warning" | "default" | "success"> = {
      EK: "info", RP: "warning", MS: "default", ED: "success", MK: "default"
    };
    return map[voc];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
        <p className="text-muted mt-1">Gerencie seus personagens e informações</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Informações da Conta</CardTitle></CardHeader>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted">Nome:</span><span>{profile?.display_name}</span></div>
          <div className="flex justify-between">
            <span className="text-muted">Cargo:</span>
            <Badge variant={profile?.role === "LEADER" ? "danger" : profile?.role === "VICE" ? "warning" : "default"}>
              {profile?.role === "LEADER" ? "Líder" : profile?.role === "VICE" ? "Vice-Líder" : "Membro"}
            </Badge>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Meus Personagens</h2>
        <Button onClick={openCreateModal} size="sm"><Plus size={16} /> Novo Personagem</Button>
      </div>

      {characters.length === 0 ? (
        <Card><p className="text-sm text-muted text-center py-8">Nenhum personagem cadastrado.</p></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((char) => (
            <Card key={char.id} className={char.is_main ? "border-primary/50" : ""}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{char.name}</h3>
                    {char.is_main && <Star size={14} className="text-yellow-400 fill-yellow-400" />}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={badgeVariant(char.vocation)}>{VOCATIONS[char.vocation].short}</Badge>
                    <span className="text-sm text-muted">Level {char.level}</span>
                  </div>
                  {char.play_times && <p className="text-xs text-muted mt-2">Horários: {char.play_times}</p>}
                </div>
                <div className="flex items-center gap-1">
                  {!char.is_main && (
                    <button onClick={() => handleSetMain(char)} className="p-1.5 rounded-lg hover:bg-surface-hover cursor-pointer" title="Definir como Main">
                      <Star size={14} className="text-muted" />
                    </button>
                  )}
                  <button onClick={() => openEditModal(char)} className="p-1.5 rounded-lg hover:bg-surface-hover cursor-pointer">
                    <Pencil size={14} className="text-muted" />
                  </button>
                  <button onClick={() => handleDelete(char)} className="p-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer">
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingChar ? "Editar Personagem" : "Novo Personagem"}>
        <div className="space-y-4">
          <Input label="Nome do Personagem" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Rubinot" />
          <Select label="Vocação" value={formVocation} onChange={(e) => setFormVocation(e.target.value as Vocation)} options={vocationOptions} />
          <Input label="Level" type="number" value={formLevel} onChange={(e) => setFormLevel(e.target.value)} placeholder="400" />
          <Input label="Horários que costuma jogar" value={formPlayTimes} onChange={(e) => setFormPlayTimes(e.target.value)} placeholder="19:00 - 23:00" />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={formIsMain} onChange={(e) => setFormIsMain(e.target.checked)} className="rounded border-border bg-surface checked:bg-primary" />
            <span className="text-sm">Personagem principal (Main)</span>
          </label>
          {formError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
              <AlertCircle size={16} />{formError}
            </div>
          )}
          <Button onClick={handleSave} className="w-full" disabled={saving}>
            {saving ? "Salvando..." : editingChar ? "Salvar" : "Cadastrar"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
