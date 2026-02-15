-- Add unique constraint for (poll_id, device_id) to allow upserting anonymous votes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'votes_poll_id_device_id_key') THEN
        ALTER TABLE votes ADD CONSTRAINT votes_poll_id_device_id_key UNIQUE (poll_id, device_id);
    END IF;
END $$;
