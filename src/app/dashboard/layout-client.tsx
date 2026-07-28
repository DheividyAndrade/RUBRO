"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pinned, setPinned] = useState(false);

  const isCollapsed = pinned ? false : collapsed;

  return (
    <div className="min-h-screen bg-background">
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <Sidebar
        collapsed={isCollapsed}
        pinned={pinned}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onExpand={() => !pinned && setCollapsed(false)}
        onCollapse={() => !pinned && setCollapsed(true)}
        onTogglePin={() => { setPinned((p) => !p); setCollapsed(false); }}
      />
      <div className={`transition-all duration-300 ${isCollapsed ? "lg:ml-16" : "lg:ml-64"} ml-0`}>
        <Header onMobileToggle={() => setMobileOpen((o) => !o)} />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
