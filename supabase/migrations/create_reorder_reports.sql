-- Create reorder_reports table for storing AI-generated weekly reports
CREATE TABLE IF NOT EXISTS reorder_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  week_start TIMESTAMPTZ NOT NULL,
  week_end TIMESTAMPTZ NOT NULL,
  report_content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_reorder_reports_week_start ON reorder_reports(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_reorder_reports_report_date ON reorder_reports(report_date DESC);

-- Add RLS policies
ALTER TABLE reorder_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Admin users can view all reports
CREATE POLICY "Admin users can view reorder reports"
  ON reorder_reports
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Policy: Admin users can insert reports
CREATE POLICY "Admin users can insert reorder reports"
  ON reorder_reports
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Policy: Admin users can update reports
CREATE POLICY "Admin users can update reorder reports"
  ON reorder_reports
  FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'admin'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reorder_reports_updated_at
  BEFORE UPDATE ON reorder_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
