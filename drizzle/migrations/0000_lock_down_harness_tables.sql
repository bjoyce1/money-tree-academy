DROP POLICY IF EXISTS "Anyone can view harness runs" ON public.harness_runs;
DROP POLICY IF EXISTS "Service role can insert" ON public.harness_runs;
DROP POLICY IF EXISTS "Anyone can view scores" ON public.harness_scores;
DROP POLICY IF EXISTS "Anyone can insert scores" ON public.harness_scores;

REVOKE ALL ON public.harness_runs FROM anon;
REVOKE ALL ON public.harness_scores FROM anon;
REVOKE ALL ON public.harness_runs FROM authenticated;
REVOKE ALL ON public.harness_scores FROM authenticated;
GRANT SELECT ON public.harness_runs TO authenticated;
GRANT SELECT ON public.harness_scores TO authenticated;
GRANT ALL ON public.harness_runs TO service_role;
GRANT ALL ON public.harness_scores TO service_role;

CREATE POLICY "Admins can view harness runs" ON public.harness_runs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view harness scores" ON public.harness_scores
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));