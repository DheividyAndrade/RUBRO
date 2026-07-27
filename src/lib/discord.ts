const WEBHOOK_URL = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL ?? "";

async function sendEmbed(embed: any) {
  if (!WEBHOOK_URL) return;
  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch {
    // silently ignore webhook errors
  }
}

export async function notifyHuntCreated({
  name,
  scheduledAt,
  endTime,
  huntType,
  creatorName,
  creatorVocation,
  slots,
}: {
  name: string;
  scheduledAt: string;
  endTime: string | null;
  huntType: "solo" | "group";
  creatorName: string;
  creatorVocation: string;
  slots: Record<string, number>;
}) {
  const dateStr = new Date(scheduledAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const startStr = new Date(scheduledAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const endStr = endTime ? new Date(endTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : null;

  const fields = [
    { name: "📅 Data", value: dateStr, inline: true },
    { name: "⏰ Horário", value: endStr ? `${startStr} — ${endStr}` : startStr, inline: true },
    { name: "👤 Criador", value: `${creatorName} (${creatorVocation})`, inline: true },
  ];

  if (huntType === "group") {
    const slotEntries = Object.entries(slots).filter(([, v]) => Number(v) > 0);
    if (slotEntries.length > 0) {
      fields.push({
        name: "👥 Vagas",
        value: slotEntries.map(([k, v]) => `**${k}**: ${v}`).join(" · "),
        inline: false,
      });
    }
  }

  const emoji = huntType === "solo" ? "🔒" : "⚔️";
  const typeLabel = huntType === "solo" ? "Hunt Solo" : "PT Aberta";

  await sendEmbed({
    title: `${emoji} ${typeLabel}: **${name}**`,
    description: "Nova hunt criada! Vá até o site para se inscrever.",
    fields,
    color: huntType === "solo" ? 0x6b7280 : 0xdc2626,
    footer: { text: "Rubro Guild Manager" },
    timestamp: new Date().toISOString(),
  });
}

export async function notifyHuntCompleted({
  name,
  totalLoot,
}: {
  name: string;
  totalLoot?: number;
}) {
  const fields = [];
  if (totalLoot != null) {
    fields.push({ name: "💰 Loot Total", value: `${totalLoot.toLocaleString("pt-BR")} gp`, inline: false });
  }

  await sendEmbed({
    title: `✅ Hunt Encerrada: **${name}**`,
    description: "Hunt concluída. Confira o loot no site.",
    fields,
    color: 0x16a34a,
    footer: { text: "Rubro Guild Manager" },
    timestamp: new Date().toISOString(),
  });
}

export async function notifyHuntCancelled({ name }: { name: string }) {
  await sendEmbed({
    title: `❌ Hunt Cancelada: **${name}**`,
    description: "Esta hunt foi cancelada.",
    color: 0xef4444,
    footer: { text: "Rubro Guild Manager" },
    timestamp: new Date().toISOString(),
  });
}

export async function notifyEventCreated({
  title,
  category,
  categoryIcon,
  startsAt,
  location,
  leader,
}: {
  title: string;
  category: string;
  categoryIcon: string;
  startsAt: string;
  location?: string;
  leader?: string;
}) {
  const dateStr = new Date(startsAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const timeStr = new Date(startsAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const fields = [
    { name: "📅 Data", value: dateStr, inline: true },
    { name: "⏰ Horário", value: timeStr, inline: true },
  ];
  if (location) fields.push({ name: "📍 Local", value: location, inline: true });
  if (leader) fields.push({ name: "👤 Líder", value: leader, inline: true });

  await sendEmbed({
    title: `${categoryIcon} ${category}: **${title}**`,
    description: "Novo evento oficial! Vá até o site para se inscrever.",
    fields,
    color: 0x3b82f6,
    footer: { text: "Rubro Guild Manager — Eventos Oficiais" },
    timestamp: new Date().toISOString(),
  });
}
