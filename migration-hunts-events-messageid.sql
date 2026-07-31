-- Run in Supabase SQL Editor
ALTER TABLE public.hunts ADD COLUMN IF NOT EXISTS discord_message_id TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS discord_message_id TEXT;
