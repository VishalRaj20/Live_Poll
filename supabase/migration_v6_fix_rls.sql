-- Add RLS policies to facilitate voting (Insert and Update for Upsert)
-- We need to ensure public users can INSERT and UPDATE their own votes (identified by device_id or user_id)
-- For simplicity in this demo, we will allow public access, as the API validates logic.

-- 1. Enable Insert (if not already fully covered)
CREATE POLICY "Allow public insert for votes" ON "votes"
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (true);

-- 2. Enable Update (Required for Upsert/Change Vote)
CREATE POLICY "Allow public update for votes" ON "votes"
AS PERMISSIVE FOR UPDATE
TO public
USING (true)
WITH CHECK (true);
