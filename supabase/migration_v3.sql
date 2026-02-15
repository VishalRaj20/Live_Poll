-- Add 'creator_id' to polls table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'polls' AND column_name = 'creator_id') THEN
        ALTER TABLE polls ADD COLUMN creator_id uuid REFERENCES auth.users(id);
    END IF;
END $$;

-- Policy to allow users to see their own polls (already covered by public select, but good for future)
-- Policy to allow users to select their own polls is effectively:
-- CREATE POLICY "Enable read access for own polls" ON "polls" USING (auth.uid() = creator_id);
-- But valid for now since we have public read access.
