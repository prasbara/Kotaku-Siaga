-- ============================================================
-- KotaKu Siaga — Migration 005: Security Audit Logs & Alerting
-- Immutable security events audit trail for authentication,
-- authorization denials, account locking, and brute-force detection
-- ============================================================

CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event VARCHAR(60) NOT NULL, -- AUTH_LOGIN_FAILED, AUTH_LOGIN_SUCCESS, AUTH_SUCCESS_AUTHORIZATION_DENIED, AUTH_ACCOUNT_BLOCKED
  identifier VARCHAR(255) NOT NULL, -- sanitized username or email, NEVER plaintext passwords
  success BOOLEAN NOT NULL DEFAULT false,
  reason VARCHAR(100), -- invalid_credentials, user_not_found, insufficient_role_citizen, account_banned
  severity VARCHAR(20) NOT NULL DEFAULT 'LOW', -- LOW, MEDIUM, HIGH, CRITICAL
  source_ip VARCHAR(100),
  user_agent TEXT,
  correlation_id VARCHAR(100),
  environment VARCHAR(50) DEFAULT 'production',
  alert_triggered BOOLEAN DEFAULT false,
  alert_details JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for lightning fast SOC querying and anomaly detection
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_event ON public.security_audit_logs(event);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_identifier ON public.security_audit_logs(identifier);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at ON public.security_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_source_ip ON public.security_audit_logs(source_ip);

-- Row Level Security (RLS)
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Security audit logs are strictly protected: only service role and admins can view
DROP POLICY IF EXISTS "Admins can view security audit logs" ON public.security_audit_logs;
CREATE POLICY "Admins can view security audit logs"
  ON public.security_audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'officer', 'government')
    )
  );

-- Service role has full access
DROP POLICY IF EXISTS "Service role can manage security audit logs" ON public.security_audit_logs;
CREATE POLICY "Service role can manage security audit logs"
  ON public.security_audit_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
