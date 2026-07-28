"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onExpand={() => setCollapsed(false)}
        onCollapse={() => setCollapsed(true)}
      />
      <div className={`transition-all duration-300 ${collapsed ? "lg:ml-16" : "lg:ml-64"} ml-0`}>
        <Header onMobileToggle={() => setMobileOpen((o) => !o)} />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
