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
import { Plus, Pencil, Trash2, Star, AlertCircle, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

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

  const [finRecords, setFinRecords] = useState<any[]>([]);
  const [finMonth, setFinMonth] = useState(new Date().getMonth());
  const [finYear, setFinYear] = useState(new Date().getFullYear());
  const [finModalOpen, setFinModalOpen] = useState(false);
  const [finCategory, setFinCategory] = useState("supplies");
  const [finType, setFinType] = useState<"expense" | "income">("expense");
  const [finAmount, setFinAmount] = useState("");
  const [finDesc, setFinDesc] = useState("");
  const [finError, setFinError] = useState("");

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
  useEffect(() => { loadFinancial(); }, [finMonth, finYear]);

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

  async function loadFinancial() {
    const res = await fetch(`/api/financial?year=${finYear}&month=${finMonth + 1}`);
    if (res.ok) setFinRecords(await res.json());
  }

  async function handleAddFinancial() {
    const rawAmount = Number(finAmount.replace(/[.,]/g, ""));
    if (!finAmount || rawAmount <= 0) { setFinError("Informe o valor."); return; }
    const res = await fetch("/api/financial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: finCategory, type: finType, amount: rawAmount, description: finDesc || null }),
    });
    if (res.ok) {
      setFinModalOpen(false); setFinAmount(""); setFinDesc(""); setFinError("");
      loadFinancial();
    } else {
      const d = await res.json();
      setFinError(d.error || "Erro.");
    }
  }

  async function handleDeleteFinancial(id: string) {
    await fetch(`/api/financial?id=${id}`, { method: "DELETE" });
    loadFinancial();
  }

  const totalIncome = finRecords.filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0);
  const totalExpense = finRecords.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);
  const balance = totalIncome - totalExpense;

  const CATEGORIES = [
    { value: "profit", label: "Lucro", icon: "$" },
    { value: "supplies", label: "Supplies", icon: "🧪" },
    { value: "imbuements", label: "Imbuements", icon: "💎" },
    { value: "vip", label: "VIP", icon: "👑" },
    { value: "upgrade_set", label: "Upgrade Set", icon: "⚔️" },
    { value: "tokens", label: "Tokens", icon: "🪙" },
    { value: "other", label: "Outros", icon: "📦" },
  ];

  const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

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
        <div className="flex gap-2">
          <Button onClick={openCreateModal} size="sm"><Plus size={16} /> Novo Personagem</Button>
        </div>
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

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <CardTitle>Financeiro</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <select value={finMonth} onChange={(e) => setFinMonth(Number(e.target.value))} className="px-2 py-1 rounded border border-border bg-background text-foreground text-xs">
                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <select value={finYear} onChange={(e) => setFinYear(Number(e.target.value))} className="px-2 py-1 rounded border border-border bg-background text-foreground text-xs">
                {[finYear - 1, finYear, finYear + 1].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </CardHeader>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-green-500/10 text-center">
            <TrendingUp size={16} className="text-green-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-400">{totalIncome.toLocaleString("pt-BR")} gp</p>
            <p className="text-xs text-muted">Lucro</p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 text-center">
            <TrendingDown size={16} className="text-red-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-red-400">{totalExpense.toLocaleString("pt-BR")} gp</p>
            <p className="text-xs text-muted">Gastos</p>
          </div>
          <div className={`p-3 rounded-lg text-center ${balance >= 0 ? "bg-green-500/10" : "bg-red-500/10"}`}>
            <DollarSign size={16} className={`mx-auto mb-1 ${balance >= 0 ? "text-green-400" : "text-red-400"}`} />
            <p className={`text-lg font-bold ${balance >= 0 ? "text-green-400" : "text-red-400"}`}>{balance.toLocaleString("pt-BR")} gp</p>
            <p className="text-xs text-muted">Saldo</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Button size="sm" variant="outline" onClick={() => { setFinError(""); setFinType("expense"); setFinCategory("supplies"); setFinModalOpen(true); }}>
            <Plus size={14} className="mr-1" /> Adicionar Gasto
          </Button>
          <Button size="sm" variant="outline" className="text-green-400 border-green-400/30 hover:bg-green-500/10" onClick={() => { setFinError(""); setFinType("income"); setFinCategory("profit"); setFinModalOpen(true); }}>
            <Plus size={14} className="mr-1" /> Lucro Aleatório
          </Button>
        </div>

        <div className="space-y-1 max-h-80 overflow-y-auto">
          {finRecords.length === 0 ? (
            <p className="text-sm text-muted text-center py-4">Nenhum registro no período.</p>
          ) : (
            finRecords.map((r) => {
              const cat = CATEGORIES.find((c) => c.value === r.category);
              return (
                <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-surface-hover">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{cat?.icon || "📦"}</span>
                    <div>
                      <span className="text-sm">{cat?.label || r.category}</span>
                      {r.description && <span className="text-xs text-muted ml-1">— {r.description}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${r.type === "income" ? "text-green-400" : "text-red-400"}`}>
                      {r.type === "income" ? "+" : "-"}{r.amount.toLocaleString("pt-BR")} gp
                    </span>
                    <span className="text-xs text-muted">{new Date(r.created_at).toLocaleDateString("pt-BR")}</span>
                    <button onClick={() => handleDeleteFinancial(r.id)} className="p-1 rounded hover:bg-red-500/10 cursor-pointer">
                      <Trash2 size={12} className="text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <Modal open={finModalOpen} onClose={() => setFinModalOpen(false)} title={finType === "income" ? "Adicionar Lucro" : "Adicionar Gasto"}>
        <div className="space-y-4">
          <Select label="Categoria" value={finCategory} onChange={(e) => setFinCategory(e.target.value)}
            options={CATEGORIES.map((c) => ({ value: c.value, label: `${c.icon} ${c.label}` }))} />
          <Input label="Valor (gp)" type="number" value={finAmount} onChange={(e) => setFinAmount(e.target.value)} placeholder="0" />
          <Input label="Descrição (opcional)" value={finDesc} onChange={(e) => setFinDesc(e.target.value)} placeholder="Ex: Divine Imbuement" />
          {finError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">{finError}</div>}
          <Button onClick={handleAddFinancial} className="w-full">Adicionar</Button>
        </div>
      </Modal>

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
