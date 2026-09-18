-- ============================================================
-- KotaKu Siaga — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "cube";
CREATE EXTENSION IF NOT EXISTS "earthdistance";

-- ============================================================
-- AREAS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  population_density INTEGER DEFAULT 50 CHECK (population_density >= 0 AND population_density <= 100),
  environmental_vulnerability INTEGER DEFAULT 50 CHECK (environmental_vulnerability >= 0 AND environmental_vulnerability <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REPORTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_code TEXT UNIQUE NOT NULL,
  title TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'banjir', 'genangan', 'drainase_tersumbat', 'sampah_menumpuk',
    'infrastruktur_hijau', 'pohon_tumbang', 'longsor', 'lainnya'
  )),
  description TEXT NOT NULL,
  district_name TEXT,
  address TEXT,
  water_height_cm INTEGER,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location_accuracy DOUBLE PRECISION,
  urgency TEXT NOT NULL CHECK (urgency IN ('rendah', 'sedang', 'tinggi', 'kritis')),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'submitted', 'under_review', 'verified', 'in_progress', 'resolved', 'rejected', 'suspicious', 'duplicate'
  )),
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN (
    'pending', 'submitted', 'under_review', 'verified', 'rejected', 'failed', 'suspicious'
  )),
  credibility_score INTEGER CHECK (credibility_score >= 0 AND credibility_score <= 100),
  verification_metadata JSONB,
  photo_url TEXT,
  photo_hash TEXT,
  photo_taken_at TIMESTAMPTZ,
  reported_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  reporter_name TEXT,
  reporter_contact TEXT,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_demo BOOLEAN DEFAULT FALSE,
  area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_verification_status ON reports(verification_status);

-- ============================================================
-- AI ANALYSIS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  original_category TEXT,
  ai_category TEXT,
  ai_confidence DOUBLE PRECISION,
  severity TEXT,
  summary TEXT,
  recommended_action TEXT,
  model_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRIORITY SCORES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS priority_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID REFERENCES areas(id) ON DELETE CASCADE,
  report_frequency DOUBLE PRECISION DEFAULT 0,
  urgency_score DOUBLE PRECISION DEFAULT 0,
  population_density_score DOUBLE PRECISION DEFAULT 0,
  vulnerability_score DOUBLE PRECISION DEFAULT 0,
  priority_score DOUBLE PRECISION DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EDUCATIONAL CONTENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS educational_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USER PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin', 'government')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'citizen');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE priority_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE educational_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Helper functions for non-recursive RLS checks
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

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated, anon;

-- Reports: Everyone can read, authenticated users can insert
CREATE POLICY "reports_select" ON reports FOR SELECT USING (true);
CREATE POLICY "reports_insert" ON reports FOR INSERT WITH CHECK (true);
CREATE POLICY "reports_update_admin" ON reports FOR UPDATE USING (
  public.is_staff()
) WITH CHECK (
  public.is_staff()
);

-- AI Analysis: Everyone can read
CREATE POLICY "ai_analysis_select" ON ai_analysis FOR SELECT USING (true);
CREATE POLICY "ai_analysis_insert" ON ai_analysis FOR INSERT WITH CHECK (true);

-- Areas: Everyone can read
CREATE POLICY "areas_select" ON areas FOR SELECT USING (true);
CREATE POLICY "areas_insert_admin" ON areas FOR INSERT WITH CHECK (
  public.is_staff()
);

-- Priority scores: Everyone can read
CREATE POLICY "priority_scores_select" ON priority_scores FOR SELECT USING (true);
CREATE POLICY "priority_scores_insert" ON priority_scores FOR INSERT WITH CHECK (true);

-- Educational contents: Everyone can read
CREATE POLICY "educational_contents_select" ON educational_contents FOR SELECT USING (true);
CREATE POLICY "educational_contents_insert_admin" ON educational_contents FOR INSERT WITH CHECK (
  public.is_admin()
);

-- Profiles: Users can read their own, admins can read all
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_admin" ON profiles FOR SELECT USING (
  public.is_admin()
);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_urgency ON reports(urgency);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_is_demo ON reports(is_demo);
CREATE INDEX IF NOT EXISTS idx_reports_location ON reports USING gist (
  ll_to_earth(latitude, longitude)
) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_analysis_report_id ON ai_analysis(report_id);
CREATE INDEX IF NOT EXISTS idx_priority_scores_area_id ON priority_scores(area_id);

-- ============================================================
-- STORAGE: Create bucket for report photos
-- Run this separately or via Supabase Dashboard
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('report-photos', 'report-photos', true);

-- Storage policy: anyone can upload, anyone can read
-- CREATE POLICY "report_photos_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'report-photos');
-- CREATE POLICY "report_photos_select" ON storage.objects FOR SELECT USING (bucket_id = 'report-photos');

-- ============================================================
-- FLOOD EVENTS TABLE (Computer Vision YOLO Detection)
-- ============================================================
CREATE TABLE IF NOT EXISTS flood_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  camera_id TEXT NOT NULL,
  camera_code TEXT NOT NULL,
  camera_name TEXT NOT NULL,
  district_name TEXT NOT NULL,
  address TEXT,
  stream_url TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('suspected', 'confirmed', 'resolved')),
  state TEXT NOT NULL DEFAULT 'FLOOD_CONFIRMED',
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'severe')),
  estimated_visual_severity TEXT NOT NULL DEFAULT 'moderate',
  model_confidence DOUBLE PRECISION NOT NULL,
  event_confidence DOUBLE PRECISION NOT NULL,
  confidence_category TEXT NOT NULL CHECK (confidence_category IN ('LOW', 'MEDIUM', 'HIGH')),
  corroboration_score DOUBLE PRECISION DEFAULT 0,
  citizen_corroboration BOOLEAN DEFAULT FALSE,
  citizen_reports_count INTEGER DEFAULT 0,
  weather_corroboration TEXT DEFAULT 'unknown',
  weather_condition_notes TEXT,
  nearby_cctv_corroboration BOOLEAN DEFAULT FALSE,
  nearby_cctv_count INTEGER DEFAULT 0,
  evidence_url TEXT,
  timeline JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER flood_events_updated_at
  BEFORE UPDATE ON flood_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FLOOD DETECTIONS TABLE (Raw Inference Frames)
-- ============================================================
CREATE TABLE IF NOT EXISTS flood_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT REFERENCES flood_events(event_id) ON DELETE SET NULL,
  camera_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  detected_class TEXT NOT NULL,
  confidence DOUBLE PRECISION NOT NULL,
  bbox JSONB NOT NULL,
  flood_confidence DOUBLE PRECISION NOT NULL,
  state TEXT NOT NULL,
  evidence_url TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CCTV HEALTH MONITORING TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS cctv_health (
  camera_id TEXT PRIMARY KEY,
  camera_code TEXT NOT NULL,
  camera_name TEXT NOT NULL,
  district TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ONLINE', 'OFFLINE', 'ERROR', 'STALE')),
  last_seen_at TIMESTAMPTZ,
  last_frame_url TEXT,
  consecutive_errors INTEGER DEFAULT 0,
  sampling_interval_sec INTEGER DEFAULT 10,
  current_state TEXT DEFAULT 'NORMAL',
  last_confidence DOUBLE PRECISION DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE flood_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE flood_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE cctv_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flood_events_select" ON flood_events FOR SELECT USING (true);
CREATE POLICY "flood_events_insert" ON flood_events FOR INSERT WITH CHECK (
  auth.role() = 'service_role' OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'government'))
);
CREATE POLICY "flood_events_update" ON flood_events FOR UPDATE USING (
  auth.role() = 'service_role' OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'government'))
);

CREATE POLICY "flood_detections_select" ON flood_detections FOR SELECT USING (true);
CREATE POLICY "flood_detections_insert" ON flood_detections FOR INSERT WITH CHECK (
  auth.role() = 'service_role' OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'government'))
);

CREATE POLICY "cctv_health_select" ON cctv_health FOR SELECT USING (true);
CREATE POLICY "cctv_health_admin_write" ON cctv_health FOR ALL USING (
  auth.role() = 'service_role' OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'government'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_flood_events_status ON flood_events(status);
CREATE INDEX IF NOT EXISTS idx_flood_events_camera_id ON flood_events(camera_id);
CREATE INDEX IF NOT EXISTS idx_flood_events_started_at ON flood_events(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_flood_detections_camera_id ON flood_detections(camera_id);
CREATE INDEX IF NOT EXISTS idx_cctv_health_status ON cctv_health(status);

-- ============================================================
-- CCTV OBSERVATIONS TABLE (Section 13 — Vercel Serverless Observations)
-- ============================================================
CREATE TABLE IF NOT EXISTS cctv_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id TEXT NOT NULL,
  camera_code TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  visual_score DOUBLE PRECISION NOT NULL,
  water_region_score DOUBLE PRECISION NOT NULL,
  road_coverage_score DOUBLE PRECISION NOT NULL,
  temporal_score DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL, -- NORMAL, WATER_SUSPECTED, FLOOD_SUSPECTED, FLOOD_CONFIRMED, FLOOD_RESOLVED
  estimated_visual_severity TEXT NOT NULL,
  evidence_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cctv_observations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cctv_observations_select" ON cctv_observations FOR SELECT USING (true);
CREATE POLICY "cctv_observations_insert" ON cctv_observations FOR INSERT WITH CHECK (
  auth.role() = 'service_role' OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'government'))
);

CREATE INDEX IF NOT EXISTS idx_cctv_observations_camera_id ON cctv_observations(camera_id);
CREATE INDEX IF NOT EXISTS idx_cctv_observations_timestamp ON cctv_observations(timestamp DESC);


