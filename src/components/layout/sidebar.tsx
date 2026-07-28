"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard, Swords, Skull, ScrollText, Calendar, UserCircle, Shield,
  History, LogOut, CalendarDays, UserPlus, FlaskRound, X,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onExpand: () => void;
  onCollapse: () => void;
}

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/hunts", label: "Hunts", icon: Swords },
  { href: "/dashboard/bosses", label: "Bosses", icon: Skull },
  { href: "/dashboard/events", label: "Eventos", icon: CalendarDays },
  { href: "/dashboard/calendar", label: "Agenda", icon: Calendar },
  { href: "/dashboard/imbuements", label: "Imbuements", icon: FlaskRound },
  { href: "/dashboard/history", label: "Histórico", icon: History },
  { href: "/dashboard/profile", label: "Perfil", icon: UserCircle },
];

export function Sidebar({ collapsed, mobileOpen, onCloseMobile, onExpand, onCollapse }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 md:p-6 border-b border-border flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-3 flex-1" onClick={onCloseMobile}>
          <div className="p-1.5 bg-primary rounded-lg flex-shrink-0">
            <Swords className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
          </div>
          <div className={`transition-opacity overflow-hidden ${collapsed ? "lg:opacity-0 lg:w-0" : "opacity-100"}`}>
            <h1 className="text-lg md:text-xl font-bold tracking-tight whitespace-nowrap">Rubro</h1>
            <p className="text-[10px] md:text-xs text-muted whitespace-nowrap">Guild Manager</p>
          </div>
        </Link>
        <button
          onClick={onCloseMobile}
          className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors lg:hidden"
        >
          <X size={20} className="text-muted" />
        </button>
      </div>

      <nav className="flex-1 p-3 md:p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "bg-primary/10 text-primary" : "text-muted hover:text-foreground hover:bg-surface-hover"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className={`transition-opacity overflow-hidden whitespace-nowrap ${collapsed ? "lg:opacity-0 lg:w-0" : "opacity-100"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 md:p-4 border-t border-border space-y-1">
        <Link
          href="/dashboard/admin"
          onClick={onCloseMobile}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            pathname === "/dashboard/admin" ? "bg-primary/10 text-primary" : "text-muted hover:text-foreground hover:bg-surface-hover"
          }`}
          title={collapsed ? "Painel do Líder" : undefined}
        >
          <Shield size={18} className="flex-shrink-0" />
          <span className={`transition-opacity overflow-hidden whitespace-nowrap ${collapsed ? "lg:opacity-0 lg:w-0" : "opacity-100"}`}>
            Painel do Líder
          </span>
        </Link>

        <a
          href="https://rubinot.com.br/guilds/RUBRO"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          title={collapsed ? "INVITE GUILDA" : undefined}
        >
          <UserPlus size={18} className="flex-shrink-0" />
          <span className={`transition-opacity overflow-hidden whitespace-nowrap ${collapsed ? "lg:opacity-0 lg:w-0" : "opacity-100"}`}>
            INVITE GUILDA
          </span>
        </a>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors w-full cursor-pointer"
          title={collapsed ? "Sair" : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          <span className={`transition-opacity overflow-hidden whitespace-nowrap ${collapsed ? "lg:opacity-0 lg:w-0" : "opacity-100"}`}>
            Sair
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border transform transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen bg-surface border-r border-border hidden lg:flex flex-col transition-all duration-300 ${
          collapsed ? "w-16" : "w-64"
        }`}
        onMouseEnter={onExpand}
        onMouseLeave={onCollapse}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
