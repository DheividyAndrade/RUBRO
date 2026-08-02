const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://rubro-ecru.vercel.app";

async function sendEmbed(channel: string, content: string, embed: any): Promise<string | null> {
  try {
    const res = await fetch(`/api/discord/${channel}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, embeds: [embed] }),
    });
    const data = await res.json();
    return data.messageId ?? null;
  } catch {
    return null;
  }
}

async function editEmbed(channel: string, messageId: string, content: string, embed: any) {
  try {
    await fetch(`/api/discord/${channel}?messageId=${encodeURIComponent(messageId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, embeds: [embed] }),
    });
  } catch {
    // silently ignore
  }
}

export async function notifyHuntCreated({
  name,
  huntId,
  scheduledAt,
  endTime,
  huntType,
  creatorName,
  creatorVocation,
  creatorLevel,
  slots,
}: {
  name: string;
  huntId: string;
  scheduledAt: string;
  endTime: string | null;
  huntType: "solo" | "group";
  creatorName: string;
  creatorVocation: string;
  creatorLevel: number;
  slots: Record<string, number>;
}): Promise<string | null> {
  const dateStr = new Date(scheduledAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const startStr = new Date(scheduledAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const endStr = endTime ? new Date(endTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : null;

  const minLevel = Math.floor((creatorLevel * 2) / 3);
  const maxLevel = Math.floor((creatorLevel * 3) / 2);

  const fields = [
    { name: "📅 Data", value: dateStr, inline: true },
    { name: "⏰ Horário", value: endStr ? `${startStr} — ${endStr}` : startStr, inline: true },
    { name: "👤 Criador", value: `${creatorName} (${creatorVocation}) Level ${creatorLevel}`, inline: true },
  ];

  if (huntType === "group") {
    fields.push({
      name: "⚖️ Shared Experience",
      value: `**${minLevel}** — **${maxLevel}**`,
      inline: true,
    });

    const slotEntries = Object.entries(slots).filter(([, v]) => Number(v) > 0);
    if (slotEntries.length > 0) {
      const slotsText = slotEntries.map(([voc, max]) => {
        const m = Number(max);
        const filled = voc === creatorVocation ? 1 : 0;
        const falta = m - filled;
        if (falta <= 0) return `**${voc}** ✅`;
        return `**${voc}** ${filled}/${m}`;
      }).join(" · ");

      const faltaText = slotEntries
        .filter(([voc, max]) => {
          const filled = voc === creatorVocation ? 1 : 0;
          return Number(max) - filled > 0;
        })
        .map(([voc, max]) => {
          const falta = Number(max) - (voc === creatorVocation ? 1 : 0);
          return `**${voc}** (falta ${falta})`;
        })
        .join(" · ");

      fields.push({ name: "👥 Vagas", value: slotsText, inline: false });

      if (faltaText) {
        fields.push({ name: "🟡 Ainda precisa de", value: faltaText, inline: false });
      }
    }
  }

  const emoji = huntType === "solo" ? "🔒" : "⚔️";
  const typeLabel = huntType === "solo" ? "Hunt Solo" : "PT Aberta";
  const link = `${APP_URL}/dashboard/hunts/${huntId}`;
  const desc = huntType === "solo"
    ? `Hunt solo de **${creatorName}**. Reservada apenas para o criador.`
    : `Nova hunt criada! [Clique aqui para se inscrever](${link})`;

  return sendEmbed("hunt", "@everyone", {
    title: `${emoji} ${typeLabel}: **${name}**`,
    description: desc,
    url: link,
    fields,
    color: huntType === "solo" ? 0x6b7280 : 0xdc2626,
    footer: { text: "Rubro Guild Manager" },
    timestamp: new Date().toISOString(),
  });
}

export async function notifyHuntCompleted({
  name,
  huntId,
  participants,
  lootTotal,
  lootSplits,
  levelChange,
  playerStats,
}: {
  name: string;
  huntId: string;
  participants?: { name: string; vocation: string }[];
  lootTotal?: number;
  lootSplits?: { name: string; amount: number }[];
  levelChange?: { oldLevel: number; newLevel: number };
  playerStats?: { name: string; damage: number; healing: number; loot: number; supplies: number }[];
}) {
  const fields = [];

  if (participants && participants.length > 0) {
    const partStr = participants
      .map((p) => `**${p.vocation}** ${p.name}`)
      .join("\n");
    fields.push({ name: `👥 Participantes (${participants.length})`, value: partStr || "Nenhum", inline: false });
  }

  if (levelChange && levelChange.newLevel > 0 && levelChange.newLevel !== levelChange.oldLevel) {
    const diff = levelChange.newLevel - levelChange.oldLevel;
    const arrow = diff > 0 ? "⬆️" : "⬇️";
    fields.push({
      name: "📊 Level",
      value: `${arrow} ${levelChange.oldLevel} → **${levelChange.newLevel}** (${diff > 0 ? "+" : ""}${diff})`,
      inline: false,
    });
  }

  if (lootTotal != null && lootTotal > 0) {
    fields.push({ name: "💰 Loot Total", value: `${lootTotal.toLocaleString("pt-BR")} gp`, inline: true });
  }

  if (lootSplits && lootSplits.length > 0) {
    const splitStr = lootSplits
      .map((s) => `**${s.name}**: ${s.amount.toLocaleString("pt-BR")} gp`)
      .join("\n");
    fields.push({ name: "💸 Divisão", value: splitStr, inline: false });
  }

  if (playerStats && playerStats.length > 0) {
    const statsStr = playerStats
      .map((s) => `**${s.name}** — ⚔ ${s.damage.toLocaleString("pt-BR")} · 💚 ${s.healing.toLocaleString("pt-BR")} · 💰 ${s.loot.toLocaleString("pt-BR")} · 🧪 ${s.supplies.toLocaleString("pt-BR")}`)
      .join("\n");
    fields.push({ name: "📋 Detalhes", value: statsStr, inline: false });
  }

  await sendEmbed("hunt", "", {
    title: `✅ Hunt Encerrada: **${name}**`,
    description: `Hunt concluída. [Ver detalhes](${APP_URL}/dashboard/hunts/${huntId})`,
    fields,
    color: 0x16a34a,
    footer: { text: "Rubro Guild Manager" },
    timestamp: new Date().toISOString(),
  });
}

export async function notifyHuntCancelled({
  name,
  huntId,
}: {
  name: string;
  huntId: string;
}) {
  await sendEmbed("hunt", "", {
    title: `❌ Hunt Cancelada: **${name}**`,
    description: `Esta hunt foi cancelada. [Ver detalhes](${APP_URL}/dashboard/hunts/${huntId})`,
    color: 0xef4444,
    footer: { text: "Rubro Guild Manager" },
    timestamp: new Date().toISOString(),
  });
}

export async function notifyHuntUpdated({
  huntName,
  huntId,
  messageId,
  scheduledAt,
  endTime,
  huntType,
  creatorName,
  creatorVocation,
  creatorLevel,
  slots,
  filledSlots,
  participants,
}: {
  huntName: string;
  huntId: string;
  messageId: string;
  scheduledAt: string;
  endTime: string | null;
  huntType: "solo" | "group";
  creatorName: string;
  creatorVocation: string;
  creatorLevel: number;
  slots: Record<string, number>;
  filledSlots: Record<string, number>;
  participants: { name: string; vocation: string }[];
}) {
  const dateStr = new Date(scheduledAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const startStr = new Date(scheduledAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const endStr = endTime ? new Date(endTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : null;

  const minLevel = Math.floor((creatorLevel * 2) / 3);
  const maxLevel = Math.floor((creatorLevel * 3) / 2);

  const fields = [
    { name: "📅 Data", value: dateStr, inline: true },
    { name: "⏰ Horário", value: endStr ? `${startStr} — ${endStr}` : startStr, inline: true },
    { name: "👤 Criador", value: `${creatorName} (${creatorVocation}) Level ${creatorLevel}`, inline: true },
  ];

  if (huntType === "group") {
    fields.push({
      name: "⚖️ Shared Experience",
      value: `**${minLevel}** — **${maxLevel}**`,
      inline: true,
    });

    const slotEntries = Object.entries(slots).filter(([, v]) => Number(v) > 0);
    if (slotEntries.length > 0) {
      const slotsText = slotEntries.map(([voc, max]) => {
        const m = Number(max);
        const filled = filledSlots[voc] ?? 0;
        const falta = m - filled;
        if (falta <= 0) return `**${voc}** ✅`;
        return `**${voc}** ${filled}/${m}`;
      }).join(" · ");

      fields.push({ name: "👥 Vagas", value: slotsText, inline: false });

      const faltaText = slotEntries
        .filter(([voc, max]) => (filledSlots[voc] ?? 0) < Number(max))
        .map(([voc, max]) => {
          const falta = Number(max) - (filledSlots[voc] ?? 0);
          return `**${voc}** (falta ${falta})`;
        })
        .join(" · ");

      if (faltaText) {
        fields.push({ name: "🟡 Ainda precisa de", value: faltaText, inline: false });
      }
    }
  }

  if (participants.length > 0) {
    fields.push({
      name: "👤 Participantes",
      value: participants.map((p) => `**${p.name}** ${p.vocation}`).join("\n"),
      inline: false,
    });
  }

  const emoji = huntType === "solo" ? "🔒" : "⚔️";
  const typeLabel = huntType === "solo" ? "Hunt Solo" : "PT Aberta";
  const link = `${APP_URL}/dashboard/hunts/${huntId}`;
  const desc = huntType === "solo"
    ? `Hunt solo de **${creatorName}**. Reservada apenas para o criador.`
    : `Nova hunt criada! [Clique aqui para se inscrever](${link})`;

  await editEmbed("hunt", messageId, "@everyone", {
    title: `${emoji} ${typeLabel}: **${huntName}**`,
    description: desc,
    url: link,
    fields,
    color: huntType === "solo" ? 0x6b7280 : 0xdc2626,
    footer: { text: "Rubro Guild Manager" },
    timestamp: new Date().toISOString(),
  });
}

export async function notifyEventCreated({
  title,
  eventId,
  category,
  categoryIcon,
  startsAt,
  location,
  leader,
  minLevel,
  maxParticipants,
}: {
  title: string;
  eventId: string;
  category: string;
  categoryIcon: string;
  startsAt: string;
  location?: string;
  leader?: string;
  minLevel?: number;
  maxParticipants?: number;
}): Promise<string | null> {
  const dateStr = new Date(startsAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const timeStr = new Date(startsAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const fields = [
    { name: "📅 Data", value: dateStr, inline: true },
    { name: "⏰ Horário", value: timeStr, inline: true },
  ];
  if (location) fields.push({ name: "📍 Local", value: location, inline: true });
  if (leader) fields.push({ name: "👤 Líder", value: leader, inline: true });
  if (minLevel && minLevel > 0) fields.push({ name: "🛡️ Level mínimo", value: String(minLevel), inline: true });
  if (maxParticipants && maxParticipants > 0) fields.push({ name: "👥 Vagas", value: `0/${maxParticipants}`, inline: true });

  const link = `${APP_URL}/dashboard/events/${eventId}`;

  return sendEmbed("event", "@everyone", {
    title: `${categoryIcon} ${category}: **${title}**`,
    description: `Novo evento oficial! [Clique aqui para se inscrever](${link})`,
    url: link,
    fields,
    color: 0x3b82f6,
    footer: { text: "Rubro Guild Manager — Eventos Oficiais" },
    timestamp: new Date().toISOString(),
  });
}

export async function notifyEventUpdated({
  eventTitle,
  eventId,
  messageId,
  category,
  categoryIcon,
  startsAt,
  location,
  leader,
  minLevel,
  maxParticipants,
  participants,
}: {
  eventTitle: string;
  eventId: string;
  messageId: string;
  category: string;
  categoryIcon: string;
  startsAt: string;
  location?: string;
  leader?: string;
  minLevel?: number;
  maxParticipants?: number;
  participants: { name: string; vocation: string }[];
}) {
  const dateStr = new Date(startsAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const timeStr = new Date(startsAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const fields = [
    { name: "📅 Data", value: dateStr, inline: true },
    { name: "⏰ Horário", value: timeStr, inline: true },
  ];
  if (location) fields.push({ name: "📍 Local", value: location, inline: true });
  if (leader) fields.push({ name: "👤 Líder", value: leader, inline: true });
  if (minLevel && minLevel > 0) fields.push({ name: "🛡️ Level mínimo", value: String(minLevel), inline: true });
  if (maxParticipants && maxParticipants > 0) {
    fields.push({ name: "👥 Vagas", value: `${participants.length}/${maxParticipants}`, inline: true });
  }

  if (participants.length > 0) {
    fields.push({
      name: "👤 Participantes",
      value: participants.map((p) => `**${p.name}** ${p.vocation}`).join("\n"),
      inline: false,
    });
  }

  const link = `${APP_URL}/dashboard/events/${eventId}`;

  await editEmbed("event", messageId, "@everyone", {
    title: `${categoryIcon} ${category}: **${eventTitle}**`,
    description: `Novo evento oficial! [Clique aqui para se inscrever](${link})`,
    url: link,
    fields,
    color: 0x3b82f6,
    footer: { text: "Rubro Guild Manager — Eventos Oficiais" },
    timestamp: new Date().toISOString(),
  });
}

const WEEKDAYS_DISCORD = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export async function notifyBossRotationCreated(bosses: { name: string; bossId: string; weekday: number; spawnInterval: number; minLevel: number; maxParticipants: number }[]): Promise<string | null> {
  const fields = bosses.map((b) => {
    const lvl = b.minLevel > 0 ? ` — Nível ${b.minLevel}+` : "";
    const vagas = b.maxParticipants > 0 ? `\n👥 Vagas: 0/${b.maxParticipants}` : "";
    return { name: `💀 ${b.name}`, value: `${WEEKDAYS_DISCORD[b.weekday] ?? String(b.weekday)} · a cada ${b.spawnInterval}d${lvl}${vagas}`, inline: false };
  });

  return sendEmbed("boss", "@everyone", {
    title: `💀 Rotação de Bosses — ${bosses.length} bosses adicionados`,
    description: `[Clique aqui para participar de toda a rotação](${APP_URL}/dashboard/bosses)`,
    fields,
    color: 0xf59e0b,
    footer: { text: "Rubro Guild Manager — Bosses" },
    timestamp: new Date().toISOString(),
  });
}

export async function notifyBossRotationUpdated({
  messageId,
  bosses,
}: {
  messageId: string;
  bosses: { name: string; bossId: string; weekday: number; spawnInterval: number; minLevel: number; maxParticipants: number; participants: { name: string; vocation: string }[] }[];
}) {
  const fields = bosses.map((b) => {
    const lvl = b.minLevel > 0 ? ` — Nível ${b.minLevel}+` : "";
    const vagas = b.maxParticipants > 0 ? `\n👥 Vagas: ${b.participants.length}/${b.maxParticipants}` : "";
    let value = `${WEEKDAYS_DISCORD[b.weekday] ?? String(b.weekday)} · a cada ${b.spawnInterval}d${lvl}${vagas}`;
    if (b.participants.length > 0) {
      value += `\n👤 ${b.participants.map((p) => `**${p.name}** ${p.vocation}`).join(", ")}`;
    }
    return { name: `💀 ${b.name}`, value, inline: false };
  });

  await editEmbed("boss", messageId, "@everyone", {
    title: `💀 Rotação de Bosses — ${bosses.length} bosses adicionados`,
    description: `[Clique aqui para participar de toda a rotação](${APP_URL}/dashboard/bosses)`,
    fields,
    color: 0xf59e0b,
    footer: { text: "Rubro Guild Manager — Bosses" },
    timestamp: new Date().toISOString(),
  });
}

export async function notifyBossCreated({
  name,
  bossId,
  weekday,
  spawnInterval,
  isOfficial,
  maxParticipants,
}: {
  name: string;
  bossId: string;
  weekday: number;
  spawnInterval: number;
  isOfficial: boolean;
  maxParticipants?: number;
}): Promise<string | null> {
  const link = `${APP_URL}/dashboard/bosses/${bossId}`;

  const fields = [
    { name: "📅 Dia", value: WEEKDAYS_DISCORD[weekday] ?? String(weekday), inline: true },
    { name: "⏱️ Spawn", value: `a cada ${spawnInterval} dias`, inline: true },
    { name: "🏷️ Tipo", value: isOfficial ? "Oficial" : "Simples", inline: true },
  ];
  if (maxParticipants && maxParticipants > 0) {
    fields.push({ name: "👥 Vagas", value: `0/${maxParticipants}`, inline: true });
  }

  return sendEmbed("boss", "@everyone", {
    title: `💀 Boss: **${name}**`,
    description: `Novo boss adicionado! [Clique aqui para participar](${link})`,
    url: link,
    fields,
    color: isOfficial ? 0xef4444 : 0xf59e0b,
    footer: { text: "Rubro Guild Manager — Bosses" },
    timestamp: new Date().toISOString(),
  });
}

export async function notifyBossJoined({
  bossName,
  bossId,
  messageId,
  maxParticipants,
  weekday,
  spawnInterval,
  isOfficial,
  participants,
}: {
  bossName: string;
  bossId: string;
  messageId: string;
  maxParticipants: number;
  weekday: number;
  spawnInterval: number;
  isOfficial: boolean;
  participants: { name: string; vocation: string }[];
}) {
  const link = `${APP_URL}/dashboard/bosses/${bossId}`;

  const fields = [
    { name: "📅 Dia", value: WEEKDAYS_DISCORD[weekday] ?? String(weekday), inline: true },
    { name: "⏱️ Spawn", value: `a cada ${spawnInterval} dias`, inline: true },
    { name: "🏷️ Tipo", value: isOfficial ? "Oficial" : "Simples", inline: true },
  ];

  if (maxParticipants && maxParticipants > 0) {
    fields.push({ name: "👥 Vagas", value: `${participants.length}/${maxParticipants}`, inline: true });
  }

  if (participants.length > 0) {
    const list = participants.map((p) => `**${p.name}** ${p.vocation}`).join("\n");
    fields.push({ name: "👤 Participantes", value: list, inline: false });
  }

  await editEmbed("boss", messageId, "@everyone", {
    title: `💀 Boss: **${bossName}**`,
    description: `Novo boss adicionado! [Clique aqui para participar](${link})`,
    url: link,
    fields,
    color: isOfficial ? 0xef4444 : 0xf59e0b,
    footer: { text: "Rubro Guild Manager — Bosses" },
    timestamp: new Date().toISOString(),
  });
}

export async function notifyLevelMilestone({
  characterName,
  characterVocation,
  level,
}: {
  characterName: string;
  characterVocation: string;
  level: number;
}) {
  await sendEmbed("hunt", "", {
    title: `🎉 **${characterName}** (${characterVocation}) alcançou Level **${level}**!`,
    description: `Parabéns ${characterName}! Continue evoluindo! 🔥`,
    color: 0xf59e0b,
    footer: { text: "Rubro Guild Manager" },
    timestamp: new Date().toISOString(),
  });
}
