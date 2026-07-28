"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard, Swords, Skull, ScrollText, Calendar, UserCircle, Shield, History, LogOut, CalendarDays, ExternalLink,
} from "lucide-react";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/hunts", label: "Hunts", icon: Swords },
  { href: "/dashboard/bosses", label: "Bosses", icon: Skull },
  { href: "/dashboard/events", label: "Eventos", icon: CalendarDays },
  { href: "/dashboard/calendar", label: "Agenda", icon: Calendar },
  { href: "/dashboard/history", label: "Histórico", icon: History },
  { href: "/dashboard/profile", label: "Perfil", icon: UserCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-surface border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Swords className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Rubro</h1>
            <p className="text-xs text-muted">Guild Manager</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "bg-primary/10 text-primary" : "text-muted hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <a
          href="https://rubinot.com.br/guilds/RUBRO"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
        >
          <ExternalLink size={18} />
          Rubinot
        </a>

        <Link
          href="/dashboard/admin"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            pathname === "/dashboard/admin" ? "bg-primary/10 text-primary" : "text-muted hover:text-foreground hover:bg-surface-hover"
          }`}
        >
          <Shield size={18} />
          Painel do Líder
        </Link>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors w-full cursor-pointer"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}
