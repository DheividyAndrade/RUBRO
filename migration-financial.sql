-- Financial Records table
CREATE TABLE IF NOT EXISTS public.financial_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense')),
  amount INTEGER NOT NULL,
  description TEXT,
  source_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own financial records"
  ON public.financial_records FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own financial records"
  ON public.financial_records FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own financial records"
  ON public.financial_records FOR DELETE USING (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_records_source_ref ON public.financial_records(source_ref);
