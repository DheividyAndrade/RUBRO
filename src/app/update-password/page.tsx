"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });
  }, [supabase]);

  async function handleUpdate() {
    if (password.length < 6) { setError("Mínimo 6 caracteres."); return; }
    setLoading(true);
    setError("");

    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) { setError(err.message); setLoading(false); return; }

    router.push("/dashboard");
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle>Link inválido ou expirado</CardTitle>
            <p className="text-sm text-muted mt-2">Solicite uma nova recuperação de senha.</p>
          </CardHeader>
          <Button variant="outline" onClick={() => router.push("/forgot-password")}>Recuperar senha</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Nova Senha</CardTitle>
          <p className="text-sm text-muted mt-1">Digite sua nova senha</p>
        </CardHeader>
        <div className="space-y-4">
          <Input
            label="Nova senha"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button onClick={handleUpdate} className="w-full" disabled={loading}>
            {loading ? "Salvando..." : "Redefinir senha"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
