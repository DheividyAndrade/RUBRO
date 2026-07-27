export function cn(...inputs: (string | boolean | undefined | null)[]): string {
  return inputs.filter(Boolean).join(" ");
}

export const VOCATIONS = {
  EK: { label: "Elite Knight", short: "EK", color: "text-knight", icon: "🛡️" },
  RP: { label: "Royal Paladin", short: "RP", color: "text-paladin", icon: "🏹" },
  MS: { label: "Master Sorcerer", short: "MS", color: "text-sorcerer", icon: "🔥" },
  ED: { label: "Elder Druid", short: "ED", color: "text-druid", icon: "🌿" },
  MK: { label: "Monk", short: "MK", color: "text-orange-400", icon: "👊" },
} as const;

export type Vocation = keyof typeof VOCATIONS;

export const ROLES = {
  LEADER: "Líder",
  VICE: "Vice-Líder",
  MEMBER: "Membro",
} as const;

export type Role = keyof typeof ROLES;

export const WEEKDAYS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;

export function sharedExpRange(level: number): { min: number; max: number } {
  return {
    min: Math.floor((level * 2) / 3),
    max: Math.floor((level * 3) / 2),
  };
}

export const HUNT_STATUS = {
  open: "Aberta",
  full: "Completa",
  completed: "Encerrada",
  cancelled: "Cancelada",
} as const;

export const EVENT_CATEGORIES = {
  quest: { label: "Quest", color: "bg-blue-500/20 text-blue-400", icon: "📜" },
  access: { label: "Access", color: "bg-green-500/20 text-green-400", icon: "🔑" },
  boss_weekly: { label: "Boss Semanal", color: "bg-yellow-500/20 text-yellow-400", icon: "💀" },
  boss_long: { label: "Boss Longo", color: "bg-red-500/20 text-red-400", icon: "☠️" },
  training: { label: "Treino", color: "bg-purple-500/20 text-purple-400", icon: "⚔️" },
  meeting: { label: "Reunião", color: "bg-sky-500/20 text-sky-400", icon: "📋" },
  war: { label: "War", color: "bg-rose-500/20 text-rose-400", icon: "⚡" },
  event: { label: "Evento", color: "bg-orange-500/20 text-orange-400", icon: "🎯" },
} as const;

export type EventCategory = keyof typeof EVENT_CATEGORIES;
