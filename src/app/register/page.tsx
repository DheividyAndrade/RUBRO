"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Turnstile } from "@/components/ui/turnstile";

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!turnstileToken) {
      setError("Resolva o captcha antes de continuar.");
      setLoading(false);
      return;
    }

    const verify = await fetch("/api/verify-turnstile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: turnstileToken }),
    }).then((r) => r.json()).catch(() => ({ ok: false }));

    if (!verify.ok) {
      setError("Falha na verificação de segurança. Tente novamente.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-black overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-background/60 to-green-600/20 z-10" />
          <img
            src="/rubro.png"
            alt="Rubro"
            className="relative z-20 max-w-[420px] w-[75%] h-auto drop-shadow-[0_0_80px_rgba(34,197,94,0.3)]"
          />
        </div>
        <div className="flex-1 flex items-center justify-center p-6 bg-background">
          <div className="w-full max-w-sm text-center">
            <div className="flex justify-center mb-8 lg:hidden">
              <img
                src="/rubro.png"
                alt="Rubro"
                className="h-16 w-auto drop-shadow-[0_0_30px_rgba(34,197,94,0.3)]"
              />
            </div>
            <Card className="border-border/50 bg-surface/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <CardTitle>Verifique seu email</CardTitle>
                <p className="text-sm text-muted mt-2">
                  Enviamos um link de confirmação. Verifique sua caixa de entrada e spam.
                </p>
              </CardHeader>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Ir para o login
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-black overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-background/60 to-primary/30 z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.15),transparent_70%)]" />
        <img
          src="/rubro.png"
          alt="Rubro"
          className="relative z-20 max-w-[420px] w-[75%] h-auto drop-shadow-[0_0_80px_rgba(220,38,38,0.35)]"
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8 lg:hidden">
            <img
              src="/rubro.png"
              alt="Rubro"
              className="h-16 w-auto drop-shadow-[0_0_30px_rgba(220,38,38,0.3)]"
            />
          </div>

          <Card className="border-border/50 bg-surface/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl tracking-tight">Criar Conta</CardTitle>
              <p className="text-sm text-muted mt-1">Rubro Guilda</p>
            </CardHeader>

            <form onSubmit={handleRegister} className="space-y-4">
              <Input
                label="Nome de exibição"
                placeholder="Seu nome"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Senha"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />

              {error && (
                <p className="text-sm text-red-400 text-center">{error}</p>
              )}

              <div className="flex justify-center">
                <Turnstile
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => setTurnstileToken("")}
                  onExpire={() => setTurnstileToken("")}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || !turnstileToken}>
                {loading ? "Criando..." : "Criar conta"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-muted">
                Já tem conta?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Entrar
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
