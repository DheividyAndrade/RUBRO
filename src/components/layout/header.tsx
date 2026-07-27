"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function Header() {
  const [profile, setProfile] = useState<{ display_name: string; role: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("display_name, role")
        .eq("id", user.id)
        .single();

      if (data) setProfile(data);
    }
    loadProfile();
  }, [supabase]);

  const roleBadge = {
    LEADER: "bg-primary/20 text-primary",
    VICE: "bg-yellow-500/20 text-yellow-400",
    MEMBER: "bg-surface-hover text-muted",
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-sm border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-3 ml-64">
        <h2 className="text-lg font-semibold">
          {profile?.display_name ?? "Carregando..."}
        </h2>
        {profile && (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge[profile.role as keyof typeof roleBadge] ?? roleBadge.MEMBER}`}>
            {profile.role === "LEADER" ? "Líder" : profile.role === "VICE" ? "Vice" : "Membro"}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/notifications"
          className="relative p-2 rounded-lg hover:bg-surface-hover transition-colors"
        >
          <Bell size={20} className="text-muted" />
        </Link>
      </div>
    </header>
  );
}
