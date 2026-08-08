"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { createClient } from "@/lib/supabase/client";

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const router = useRouter();

  const isCollapsed = pinned ? false : collapsed;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }, [router]);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(logout, INACTIVITY_TIMEOUT);
  }, [logout]);

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [resetTimer]);

  useEffect(() => {
    const heartbeat = setInterval(async () => {
      await fetch("/api/heartbeat", { method: "POST" }).catch(() => {});
    }, 60000);
    fetch("/api/heartbeat", { method: "POST" }).catch(() => {});
    return () => clearInterval(heartbeat);
  }, []);

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
