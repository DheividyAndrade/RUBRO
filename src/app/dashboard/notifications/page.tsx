"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Check } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const supabase = createClient();

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    setNotifications(data ?? []);
  }

  async function markAsRead(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    loadNotifications();
  }

  async function markAllRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    loadNotifications();
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notificações</h1>
          <p className="text-muted mt-1">
            {unreadCount > 0
              ? `${unreadCount} não lida(s)`
              : "Todas lidas"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-primary hover:underline cursor-pointer"
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <p className="text-sm text-muted text-center py-8">
            Nenhuma notificação.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`flex items-start justify-between p-4 rounded-lg border transition-colors ${
                notif.read
                  ? "bg-surface border-border"
                  : "bg-surface-hover border-primary/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    notif.read ? "bg-surface-hover" : "bg-primary/10"
                  }`}
                >
                  <Bell
                    size={16}
                    className={notif.read ? "text-muted" : "text-primary"}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">{notif.title}</p>
                  <p className="text-sm text-muted mt-0.5">{notif.message}</p>
                  <p className="text-xs text-muted mt-1">
                    {formatDate(notif.created_at)}
                  </p>
                </div>
              </div>
              {!notif.read && (
                <button
                  onClick={() => markAsRead(notif.id)}
                  className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
                  title="Marcar como lida"
                >
                  <Check size={16} className="text-success" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
