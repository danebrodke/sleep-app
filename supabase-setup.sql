-- Create sleep_notes table
CREATE TABLE IF NOT EXISTS sleep_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sleep_date DATE NOT NULL UNIQUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_sleep_notes_updated_at
BEFORE UPDATE ON sleep_notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create an index on sleep_date for faster lookups
CREATE INDEX IF NOT EXISTS idx_sleep_notes_sleep_date ON sleep_notes(sleep_date);

-- Create RLS policies
ALTER TABLE sleep_notes ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for now (in a production app, you'd want to restrict this)
CREATE POLICY "Allow anonymous access to sleep_notes"
ON sleep_notes
FOR ALL
TO anon
USING (true)
WITH CHECK (true); 