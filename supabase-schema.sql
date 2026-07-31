CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('LEADER', 'VICE', 'MEMBER')),
  display_name TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Leaders can update any profile"
  ON public.profiles FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'LEADER'
    )
  );

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
    'MEMBER'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE IF NOT EXISTS public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  vocation TEXT NOT NULL CHECK (vocation IN ('EK', 'RP', 'MS', 'ED')),
  level INTEGER NOT NULL DEFAULT 0,
  is_main BOOLEAN NOT NULL DEFAULT false,
  play_times TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Characters are viewable by everyone"
  ON public.characters FOR SELECT USING (true);

CREATE POLICY "Users can insert own characters"
  ON public.characters FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own characters"
  ON public.characters FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own characters"
  ON public.characters FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.hunts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  min_level INTEGER NOT NULL DEFAULT 0,
  max_players INTEGER NOT NULL DEFAULT 5,
  slots JSONB NOT NULL DEFAULT '{"EK":1,"RP":2,"MS":1,"ED":1}',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'full', 'completed', 'cancelled')),
  discord_message_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.hunts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hunts are viewable by everyone"
  ON public.hunts FOR SELECT USING (true);

CREATE POLICY "Leaders and vice can create hunts"
  ON public.hunts FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('LEADER', 'VICE')
    )
  );

CREATE POLICY "Leaders, vice, and creator can update hunts"
  ON public.hunts FOR UPDATE USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('LEADER', 'VICE')
    )
  );

CREATE POLICY "Leaders and creator can delete hunts"
  ON public.hunts FOR DELETE USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'LEADER'
    )
  );

CREATE TABLE IF NOT EXISTS public.hunt_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hunt_id UUID NOT NULL REFERENCES public.hunts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  vocation_slot TEXT NOT NULL CHECK (vocation_slot IN ('EK', 'RP', 'MS', 'ED')),
  confirmed BOOLEAN NOT NULL DEFAULT false,
  is_waiting BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(hunt_id, user_id)
);

ALTER TABLE public.hunt_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants are viewable by everyone"
  ON public.hunt_participants FOR SELECT USING (true);

CREATE POLICY "Users can join hunts"
  ON public.hunt_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation"
  ON public.hunt_participants FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can leave hunts"
  ON public.hunt_participants FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.bosses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weekday INTEGER DEFAULT 0,
  spawn_interval INTEGER DEFAULT 15,
  is_official BOOLEAN DEFAULT false,
  max_participants INTEGER DEFAULT 0,
  min_level INTEGER DEFAULT 0,
  discord_message_id TEXT,
  rotation_group UUID,
  last_killed_at TIMESTAMPTZ,
  next_spawn_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.bosses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bosses are viewable by everyone"
  ON public.bosses FOR SELECT USING (true);

CREATE POLICY "Leaders and vice can manage bosses"
  ON public.bosses FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('LEADER', 'VICE')
    )
  );

CREATE POLICY "Leaders, vice, and creator can update bosses"
  ON public.bosses FOR UPDATE USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('LEADER', 'VICE')
    )
  );

CREATE POLICY "Leaders and creator can delete bosses"
  ON public.bosses FOR DELETE USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'LEADER'
    )
  );

CREATE TABLE IF NOT EXISTS public.boss_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boss_id UUID NOT NULL REFERENCES public.bosses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  confirmed BOOLEAN NOT NULL DEFAULT false,
  killed_at TIMESTAMPTZ,
  UNIQUE(boss_id, user_id)
);

ALTER TABLE public.boss_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Boss participants are viewable by everyone"
  ON public.boss_participants FOR SELECT USING (true);

CREATE POLICY "Users can join boss kills"
  ON public.boss_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation"
  ON public.boss_participants FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can leave boss kills"
  ON public.boss_participants FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  min_level INTEGER NOT NULL DEFAULT 0,
  requirements JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  slots JSONB NOT NULL DEFAULT '{"EK":1,"RP":2,"MS":1,"ED":1}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quests are viewable by everyone"
  ON public.quests FOR SELECT USING (true);

CREATE POLICY "Leaders and vice can create quests"
  ON public.quests FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('LEADER', 'VICE')
    )
  );

CREATE POLICY "Leaders, vice, and creator can update quests"
  ON public.quests FOR UPDATE USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('LEADER', 'VICE')
    )
  );

CREATE POLICY "Leaders and creator can delete quests"
  ON public.quests FOR DELETE USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'LEADER'
    )
  );

CREATE TABLE IF NOT EXISTS public.quest_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  confirmed BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(quest_id, user_id)
);

ALTER TABLE public.quest_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quest participants are viewable by everyone"
  ON public.quest_participants FOR SELECT USING (true);

CREATE POLICY "Users can join quests"
  ON public.quest_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation"
  ON public.quest_participants FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can leave quests"
  ON public.quest_participants FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'event' CHECK (event_type IN ('hunt', 'boss', 'quest', 'war', 'event')),
  reference_id UUID,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  discord_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are viewable by everyone"
  ON public.events FOR SELECT USING (true);

CREATE POLICY "Leaders and vice can create events"
  ON public.events FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('LEADER', 'VICE')
    )
  );

CREATE POLICY "Leaders, vice, and creator can update events"
  ON public.events FOR UPDATE USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('LEADER', 'VICE')
    )
  );

CREATE POLICY "Leaders and creator can delete events"
  ON public.events FOR DELETE USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'LEADER'
    )
  );

CREATE TABLE IF NOT EXISTS public.loot_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hunt_id UUID REFERENCES public.hunts(id) ON DELETE SET NULL,
  boss_id UUID REFERENCES public.bosses(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  split_among JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.loot_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Loot is viewable by everyone"
  ON public.loot_history FOR SELECT USING (true);

CREATE POLICY "Leaders and vice can insert loot"
  ON public.loot_history FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('LEADER', 'VICE')
    )
  );

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications"
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can mark as read"
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.hunts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hunt_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bosses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
