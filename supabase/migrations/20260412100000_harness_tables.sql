-- Harness run log (tracks every AI interaction)
CREATE TABLE public.harness_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_used TEXT NOT NULL DEFAULT 'chapter_discussion',
  guide_id TEXT,
  chapter_id TEXT,
  user_message TEXT,
  prompt_length INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.harness_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view harness runs" ON public.harness_runs FOR SELECT USING (true);
CREATE POLICY "Service role can insert" ON public.harness_runs FOR INSERT WITH CHECK (true);

-- Harness feedback scores (thumbs up/down on responses)
CREATE TABLE public.harness_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_used TEXT NOT NULL,
  positive BOOLEAN NOT NULL DEFAULT true,
  score REAL NOT NULL DEFAULT 0.5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.harness_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view scores" ON public.harness_scores FOR SELECT USING (true);
CREATE POLICY "Anyone can insert scores" ON public.harness_scores FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX idx_harness_runs_config ON public.harness_runs(config_used);
CREATE INDEX idx_harness_runs_created ON public.harness_runs(created_at DESC);
CREATE INDEX idx_harness_scores_config ON public.harness_scores(config_used);
