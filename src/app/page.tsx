import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-black overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-background/60 to-primary/30 z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.15),transparent_70%)]" />
        <img
          src="/rubro.png"
          alt="Rubro"
          className="relative z-20 max-w-[420px] w-[75%] h-auto animate-float animate-glow"
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center mb-8 lg:hidden">
            <img
              src="/rubro.png"
              alt="Rubro"
              className="h-16 w-auto drop-shadow-[0_0_30px_rgba(220,38,38,0.3)]"
            />
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-2">Rubro</h1>
          <p className="text-muted mb-8">
            Gerenciador de Guilda para Tibia.
            <br />
            Organize hunts, bosses, quests e sua PT.
          </p>

          <div className="space-y-3">
            <Link href="/login" className="block">
              <Button className="w-full" size="lg">
                Entrar
              </Button>
            </Link>
            <Link href="/register" className="block">
              <Button variant="outline" className="w-full" size="lg">
                Criar conta
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted/50 mt-8">
            &copy; {new Date().getFullYear()} Rubro Guilda
          </p>
        </div>
      </div>
    </div>
  );
}
