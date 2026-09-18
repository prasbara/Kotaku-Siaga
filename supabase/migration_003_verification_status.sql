-- ============================================================
-- Migration 003: Add verification_status to reports table
-- Synchronizes verification status schema for administrative moderation
-- ============================================================

-- 1. ADD verification_status COLUMN TO reports IF NOT EXISTS
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';

-- 2. ADD CHECK CONSTRAINT FOR VALID STATUSES (IDEMPOTENT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reports_verification_status_check'
      AND conrelid = 'public.reports'::regclass
  ) THEN
    ALTER TABLE public.reports
      ADD CONSTRAINT reports_verification_status_check
      CHECK (verification_status IN (
        'pending', 'submitted', 'under_review', 'verified', 'rejected', 'failed', 'suspicious'
      ));
  END IF;
END $$;

-- 3. CREATE INDEX FOR FASTER FILTERING & QUERIES
CREATE INDEX IF NOT EXISTS idx_reports_verification_status
  ON public.reports(verification_status);

-- 4. SAFELY POPULATE verification_status FOR EXISTING REPORTS (ZERO DATA LOSS)
UPDATE public.reports
SET verification_status = CASE
  WHEN (verification_metadata->>'verification_status') IS NOT NULL
    AND (verification_metadata->>'verification_status') IN (
      'pending', 'submitted', 'under_review', 'verified', 'rejected', 'failed', 'suspicious'
    )
    THEN verification_metadata->>'verification_status'
  WHEN status IN ('verified', 'in_progress', 'resolved') THEN 'verified'
  WHEN status = 'rejected' THEN 'rejected'
  WHEN status = 'under_review' THEN 'under_review'
  WHEN status = 'suspicious' THEN 'suspicious'
  ELSE 'pending'
END
WHERE verification_status IS NULL OR verification_status = 'pending';

-- 5. RELOAD SCHEMA CACHE FOR POSTGREST
NOTIFY pgrst, 'reload schema';
