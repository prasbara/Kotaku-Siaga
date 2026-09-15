-- ============================================================
-- KotaKu Siaga - Production Migration: Email OTP + SOS + Incident Clustering
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. EXTEND REPORTS TABLE
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS reporter_email TEXT,
  ADD COLUMN IF NOT EXISTS reporter_phone TEXT,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS turnstile_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS incident_cluster_id UUID,
  ADD COLUMN IF NOT EXISTS independent_reporter_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS corroboration_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS abuse_score INTEGER DEFAULT 0 CHECK (abuse_score >= 0 AND abuse_score <= 100),
  ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'standard' CHECK (event_type IN ('standard', 'emergency_sos')),
  ADD COLUMN IF NOT EXISTS client_session_id TEXT,
  ADD COLUMN IF NOT EXISTS client_ip_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_reports_incident_cluster ON reports(incident_cluster_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_email ON reports(reporter_email);
CREATE INDEX IF NOT EXISTS idx_reports_email_verified ON reports(email_verified);

-- ============================================================
-- 2. INCIDENT CLUSTERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS incident_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_code TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  district_name TEXT,
  first_report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_m DOUBLE PRECISION DEFAULT 250,
  time_window_minutes INTEGER DEFAULT 30,
  report_count INTEGER DEFAULT 1,
  independent_reporter_count INTEGER DEFAULT 1,
  corroboration_score DOUBLE PRECISION DEFAULT 0,
  confidence_level TEXT DEFAULT 'LOW' CHECK (confidence_level IN ('LOW', 'MEDIUM', 'HIGH', 'CONFIRMED')),
  status TEXT DEFAULT 'NEW' CHECK (status IN (
    'NEW', 'CORROBORATED', 'CONFIRMED_BY_CORROBORATION',
    'ADMIN_CONFIRMED', 'FALSE_REPORT', 'REQUIRES_REVIEW',
    'DUPLICATE', 'RESOLVED', 'CLOSED'
  )),
  first_reported_at TIMESTAMPTZ DEFAULT NOW(),
  last_reported_at TIMESTAMPTZ DEFAULT NOW(),
  evidence_photos TEXT[] DEFAULT '{}',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE incident_clusters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clusters_select_public" ON incident_clusters FOR SELECT USING (true);
CREATE POLICY "clusters_all_service" ON incident_clusters FOR ALL USING (
  auth.role() = 'service_role' OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'government'))
);

CREATE TRIGGER incident_clusters_updated_at
  BEFORE UPDATE ON incident_clusters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_clusters_status ON incident_clusters(status);
CREATE INDEX IF NOT EXISTS idx_clusters_category ON incident_clusters(category);
CREATE INDEX IF NOT EXISTS idx_clusters_first_reported ON incident_clusters(first_reported_at DESC);

-- ============================================================
-- 3. SOS EVENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS sos_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sos_code TEXT UNIQUE NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_accuracy DOUBLE PRECISION,
  location_available BOOLEAN DEFAULT FALSE,
  district_name TEXT,
  client_session_id TEXT,
  client_ip_hash TEXT,
  status TEXT DEFAULT 'NEW' CHECK (status IN ('NEW', 'ACKNOWLEDGED', 'DISPATCHED', 'RESOLVED', 'FALSE_ALARM')),
  priority TEXT DEFAULT 'CRITICAL',
  reporter_name TEXT,
  reporter_phone TEXT,
  reporter_email TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  description TEXT,
  photo_url TEXT,
  incident_cluster_id UUID REFERENCES incident_clusters(id) ON DELETE SET NULL,
  admin_notes TEXT,
  dispatched_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sos_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sos_insert_public" ON sos_events FOR INSERT WITH CHECK (true);
CREATE POLICY "sos_select_admin" ON sos_events FOR SELECT USING (
  auth.role() = 'service_role' OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'government'))
);
CREATE POLICY "sos_update_admin" ON sos_events FOR UPDATE USING (
  auth.role() = 'service_role' OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'government'))
);

CREATE TRIGGER sos_events_updated_at
  BEFORE UPDATE ON sos_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_sos_status ON sos_events(status);
CREATE INDEX IF NOT EXISTS idx_sos_priority ON sos_events(priority);
CREATE INDEX IF NOT EXISTS idx_sos_created_at ON sos_events(created_at DESC);
