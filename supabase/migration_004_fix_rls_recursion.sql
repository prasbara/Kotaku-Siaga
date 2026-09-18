-- ============================================================
-- Migration 004: Fix Infinite Recursion in Profiles RLS & Optimize Role Guards
-- Eliminates PostgreSQL 42P17 recursion error on profiles table
-- ============================================================

-- 1. Create SECURITY DEFINER helper functions to query roles without RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'government')
  );
$$;

-- Grant execution to authenticated & anon roles
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated, anon;

-- 2. Drop old recursive policy on profiles
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;

-- 3. Create non-recursive policy using is_admin()
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT
  USING (public.is_admin());

-- 4. Optimize reports_update_admin policy with is_staff()
DROP POLICY IF EXISTS "reports_update_admin" ON public.reports;
CREATE POLICY "reports_update_admin" ON public.reports
  FOR UPDATE
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- 5. Optimize areas_insert_admin policy with is_staff()
DROP POLICY IF EXISTS "areas_insert_admin" ON public.areas;
CREATE POLICY "areas_insert_admin" ON public.areas
  FOR INSERT
  WITH CHECK (public.is_staff());

-- 6. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
