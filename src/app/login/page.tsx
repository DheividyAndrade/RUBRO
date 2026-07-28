"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Turnstile } from "@/components/ui/turnstile";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [showSplash, setShowSplash] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (showSplash) {
      router.prefetch("/dashboard");
      const fadeTimer = setTimeout(() => setFadeOut(true), 3500);
      const redirectTimer = setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 4000);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(redirectTimer);
      };
    }
  }, [showSplash, router]);

  async function handleLogin(e: React.FormEvent) {
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
      setError("Falha na verificação de segurança.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Email ou senha inválidos.");
      setLoading(false);
    } else {
      setShowSplash(true);
    }
  }

  return (
    <>
      {showSplash && (
        <div className={`fixed inset-0 z-50 bg-black transition-opacity duration-700 ${fadeOut ? "opacity-0" : "opacity-100"}`} style={{ backgroundImage: "url(/abertura_site.gif)", backgroundSize: "100% 100%", backgroundPosition: "center", backgroundRepeat: "no-repeat" }} />
      )}

    <div className="min-h-screen flex">
      <div
        className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-black overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black via-background/60 to-primary/30 z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.15),transparent_70%)]" />
        <img
          src="/rubro.png"
          alt="Rubro"
          className="relative z-20 max-w-[420px] w-[75%] h-auto animate-float animate-glow"
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
              <CardTitle className="text-2xl tracking-tight">Entrar</CardTitle>
              <p className="text-sm text-muted mt-1">Rubro Gerenciador de Guilda</p>
            </CardHeader>

            <form onSubmit={handleLogin} className="space-y-4">
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
                placeholder="******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="mt-4 text-center space-y-2">
              <p className="text-sm text-muted">
                <Link href="/forgot-password" className="hover:text-foreground transition-colors">
                  Esqueceu a senha?
                </Link>
              </p>
              <p className="text-sm text-muted">
                Não tem conta?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  Cadastre-se
                </Link>
              </p>
            </div>
          </Card>

          <p className="text-center text-xs text-muted/50 mt-6">
            &copy; {new Date().getFullYear()} Rubro Guilda. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
