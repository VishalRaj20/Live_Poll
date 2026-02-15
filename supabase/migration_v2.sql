-- 1. Add 'require_login' to polls if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'polls' AND column_name = 'require_login') THEN
        ALTER TABLE polls ADD COLUMN require_login boolean DEFAULT false;
    END IF;
END $$;

-- 2. Add 'user_id' to votes if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'votes' AND column_name = 'user_id') THEN
        ALTER TABLE votes ADD COLUMN user_id uuid REFERENCES auth.users(id);
    END IF;
END $$;

-- 3. Add unique constraint for (poll_id, user_id) to prevent multiple votes by same user
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'votes_poll_id_user_id_key') THEN
        ALTER TABLE votes ADD CONSTRAINT votes_poll_id_user_id_key UNIQUE (poll_id, user_id);
    END IF;
END $$;

-- 4. Note: Policies
-- If you received an error about policies already existing, it's because the previous script tried to create them again.
-- The existing policies (allow all select/insert) are compatible with these changes for this demo app.
-- No further policy changes are strictly required as our API handles the logic, 
-- but you can run this to ensure the 'votes' table allows public inserts (which it likely already does).

-- Optional: Ensure RLS is enabled (idempotent)
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
