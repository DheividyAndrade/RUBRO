-- Run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creature TEXT NOT NULL,
  location TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  min_level INTEGER NOT NULL DEFAULT 0,
  max_players INTEGER NOT NULL DEFAULT 5,
  slots JSONB NOT NULL DEFAULT '{"EK":1,"RP":2,"MS":1,"ED":1}',
  hunt_type TEXT NOT NULL DEFAULT 'group' CHECK (hunt_type IN ('solo', 'group')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'full', 'completed', 'cancelled')),
  discord_message_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tasks are viewable by everyone"
  ON public.tasks FOR SELECT USING (true);

CREATE POLICY "Leaders and vice can create tasks"
  ON public.tasks FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('LEADER', 'VICE')
    )
  );

CREATE POLICY "Creator can update own tasks"
  ON public.tasks FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Creator can delete own tasks"
  ON public.tasks FOR DELETE USING (auth.uid() = created_by);

-- Task participants table
CREATE TABLE IF NOT EXISTS public.task_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  vocation_slot TEXT NOT NULL CHECK (vocation_slot IN ('EK', 'RP', 'MS', 'ED', 'MK')),
  confirmed BOOLEAN DEFAULT false,
  is_waiting BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

ALTER TABLE public.task_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Task participants are viewable by everyone"
  ON public.task_participants FOR SELECT USING (true);

CREATE POLICY "Users can insert own task participation"
  ON public.task_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own task participation"
  ON public.task_participants FOR DELETE USING (auth.uid() = user_id);

-- Add task_id to loot_history
ALTER TABLE public.loot_history ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL;
