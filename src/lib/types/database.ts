export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: "LEADER" | "VICE" | "MEMBER";
          display_name: string;
          joined_at: string;
          created_at: string;
        };
        Insert: {
          id: string;
          role?: "LEADER" | "VICE" | "MEMBER";
          display_name: string;
          joined_at?: string;
        };
        Update: {
          role?: "LEADER" | "VICE" | "MEMBER";
          display_name?: string;
        };
      };
      characters: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          vocation: "EK" | "RP" | "MS" | "ED";
          level: number;
          is_main: boolean;
          play_times: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          vocation: "EK" | "RP" | "MS" | "ED";
          level: number;
          is_main?: boolean;
          play_times?: string;
        };
        Update: {
          name?: string;
          vocation?: "EK" | "RP" | "MS" | "ED";
          level?: number;
          is_main?: boolean;
          play_times?: string;
        };
      };
      hunts: {
        Row: {
          id: string;
          created_by: string;
          name: string;
          scheduled_at: string;
          min_level: number;
          max_players: number;
          slots: Json;
          status: "open" | "full" | "completed" | "cancelled";
          discord_message_id: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          created_by: string;
          name: string;
          scheduled_at: string;
          min_level?: number;
          max_players?: number;
          slots?: Json;
          status?: "open" | "full" | "completed" | "cancelled";
          discord_message_id?: string | null;
          notes?: string | null;
        };
        Update: {
          name?: string;
          scheduled_at?: string;
          min_level?: number;
          max_players?: number;
          slots?: Json;
          status?: "open" | "full" | "completed" | "cancelled";
          discord_message_id?: string | null;
          notes?: string | null;
        };
      };
      hunt_participants: {
        Row: {
          id: string;
          hunt_id: string;
          user_id: string;
          character_id: string;
          vocation_slot: "EK" | "RP" | "MS" | "ED";
          confirmed: boolean;
          is_waiting: boolean;
          joined_at: string;
        };
        Insert: {
          hunt_id: string;
          user_id: string;
          character_id: string;
          vocation_slot: "EK" | "RP" | "MS" | "ED";
          confirmed?: boolean;
          is_waiting?: boolean;
        };
        Update: {
          confirmed?: boolean;
          is_waiting?: boolean;
          character_id?: string;
        };
      };
      bosses: {
        Row: {
          id: string;
          created_by: string;
          name: string;
          weekday: number;
          spawn_interval: number;
          is_official: boolean;
          max_participants: number;
          min_level: number;
          discord_message_id: string | null;
          rotation_group: string | null;
          last_killed_at: string | null;
          next_spawn_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          created_by: string;
          name: string;
          weekday?: number;
          spawn_interval?: number;
          is_official?: boolean;
          max_participants?: number;
          min_level?: number;
          discord_message_id?: string | null;
          last_killed_at?: string | null;
          next_spawn_at?: string | null;
          notes?: string | null;
        };
        Update: {
          name?: string;
          weekday?: number;
          spawn_interval?: number;
          is_official?: boolean;
          max_participants?: number;
          min_level?: number;
          discord_message_id?: string | null;
          last_killed_at?: string | null;
          next_spawn_at?: string | null;
          notes?: string | null;
        };
      };
      boss_participants: {
        Row: {
          id: string;
          boss_id: string;
          user_id: string;
          character_id: string;
          confirmed: boolean;
          killed_at: string | null;
        };
        Insert: {
          boss_id: string;
          user_id: string;
          character_id: string;
          confirmed?: boolean;
          killed_at?: string | null;
        };
        Update: {
          confirmed?: boolean;
          killed_at?: string | null;
        };
      };
      quests: {
        Row: {
          id: string;
          created_by: string;
          name: string;
          description: string | null;
          min_level: number;
          requirements: Json;
          status: "open" | "in_progress" | "completed" | "cancelled";
          slots: Json;
          created_at: string;
        };
        Insert: {
          created_by: string;
          name: string;
          description?: string | null;
          min_level?: number;
          requirements?: Json;
          status?: "open" | "in_progress" | "completed" | "cancelled";
          slots?: Json;
        };
        Update: {
          name?: string;
          description?: string | null;
          min_level?: number;
          requirements?: Json;
          status?: "open" | "in_progress" | "completed" | "cancelled";
          slots?: Json;
        };
      };
      quest_participants: {
        Row: {
          id: string;
          quest_id: string;
          user_id: string;
          character_id: string;
          confirmed: boolean;
          joined_at: string;
        };
        Insert: {
          quest_id: string;
          user_id: string;
          character_id: string;
          confirmed?: boolean;
        };
        Update: {
          confirmed?: boolean;
        };
      };
      events: {
        Row: {
          id: string;
          created_by: string;
          title: string;
          description: string | null;
          event_type: "hunt" | "boss" | "quest" | "war" | "event";
          reference_id: string | null;
          starts_at: string;
          ends_at: string | null;
          discord_message_id: string | null;
          created_at: string;
        };
        Insert: {
          created_by: string;
          title: string;
          description?: string | null;
          event_type?: "hunt" | "boss" | "quest" | "war" | "event";
          reference_id?: string | null;
          starts_at: string;
          ends_at?: string | null;
          discord_message_id?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          event_type?: "hunt" | "boss" | "quest" | "war" | "event";
          reference_id?: string | null;
          starts_at?: string;
          ends_at?: string | null;
          discord_message_id?: string | null;
        };
      };
      loot_history: {
        Row: {
          id: string;
          hunt_id: string | null;
          boss_id: string | null;
          item_name: string;
          value: number;
          split_among: Json;
          created_at: string;
        };
        Insert: {
          hunt_id?: string | null;
          boss_id?: string | null;
          item_name: string;
          value: number;
          split_among?: Json;
        };
        Update: {
          item_name?: string;
          value?: number;
          split_among?: Json;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          read: boolean;
          link: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          title: string;
          message: string;
          read?: boolean;
          link?: string | null;
        };
        Update: {
          read?: boolean;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}
