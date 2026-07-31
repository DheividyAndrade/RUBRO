-- Run this in Supabase SQL Editor to add missing columns to bosses table
ALTER TABLE public.bosses ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT false;
ALTER TABLE public.bosses ADD COLUMN IF NOT EXISTS max_participants INTEGER DEFAULT 0;
ALTER TABLE public.bosses ADD COLUMN IF NOT EXISTS min_level INTEGER DEFAULT 0;
ALTER TABLE public.bosses ADD COLUMN IF NOT EXISTS discord_message_id TEXT;
ALTER TABLE public.bosses ADD COLUMN IF NOT EXISTS rotation_group UUID;
