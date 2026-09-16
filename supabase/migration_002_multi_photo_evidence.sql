-- ============================================================
-- Migration 002: Multi-Photo Authenticity & Disaster Evidence Verification
-- Adds report_evidence, evidence_relations, and associated indexes & RLS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.report_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    width INTEGER,
    height INTEGER,

    sha256 TEXT NOT NULL,
    phash TEXT,
    phash_version TEXT DEFAULT 'dhash_v1',

    capture_timestamp TIMESTAMPTZ,
    capture_timestamp_source TEXT DEFAULT 'none',
    capture_timestamp_status TEXT DEFAULT 'timestamp_unavailable',
    capture_timestamp_age_hours NUMERIC(10, 2),

    exif_latitude NUMERIC(10, 7),
    exif_longitude NUMERIC(10, 7),
    gps_status TEXT DEFAULT 'gps_unavailable',
    gps_distance_meters NUMERIC(12, 2),

    ai_status TEXT DEFAULT 'pending', -- 'analyzed' | 'unavailable' | 'pending' | 'failed'
    ai_provider TEXT,
    ai_category TEXT,
    ai_confidence NUMERIC(5, 2),
    ai_anomaly_flags JSONB DEFAULT '[]'::jsonb,
    ai_analysis_reason TEXT,

    verification_status TEXT DEFAULT 'unverified', -- 'consistent' | 'review_required' | 'inconsistent'
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_evidence_report_id ON public.report_evidence(report_id);
CREATE INDEX IF NOT EXISTS idx_report_evidence_sha256 ON public.report_evidence(sha256);
CREATE INDEX IF NOT EXISTS idx_report_evidence_phash ON public.report_evidence(phash);

CREATE TABLE IF NOT EXISTS public.evidence_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id UUID REFERENCES public.report_evidence(id) ON DELETE CASCADE,
    related_evidence_id UUID REFERENCES public.report_evidence(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL, -- 'exact_duplicate' | 'visual_similarity' | 'potential_reuse' | 'same_incident'
    similarity_score NUMERIC(5, 2),
    phash_distance INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_evidence_pair UNIQUE(evidence_id, related_evidence_id)
);

CREATE INDEX IF NOT EXISTS idx_evidence_relations_evidence_id ON public.evidence_relations(evidence_id);

-- RLS
ALTER TABLE public.report_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_relations ENABLE ROW LEVEL SECURITY;

-- Allow public read access to evidence records
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'report_evidence' AND policyname = 'Allow public select on report_evidence'
    ) THEN
        CREATE POLICY "Allow public select on report_evidence"
            ON public.report_evidence FOR SELECT
            TO public
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'report_evidence' AND policyname = 'Allow service_role full access on report_evidence'
    ) THEN
        CREATE POLICY "Allow service_role full access on report_evidence"
            ON public.report_evidence FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'evidence_relations' AND policyname = 'Allow public select on evidence_relations'
    ) THEN
        CREATE POLICY "Allow public select on evidence_relations"
            ON public.evidence_relations FOR SELECT
            TO public
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'evidence_relations' AND policyname = 'Allow service_role full access on evidence_relations'
    ) THEN
        CREATE POLICY "Allow service_role full access on evidence_relations"
            ON public.evidence_relations FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;
