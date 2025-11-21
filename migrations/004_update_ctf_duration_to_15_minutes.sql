-- Migration: Update all CTF duration to 15 minutes
-- Date: 2024

-- Update all CTF records to have duration of 15 minutes
UPDATE ctf 
SET duration = INTERVAL '15 minutes'
WHERE duration IS NULL OR duration != INTERVAL '15 minutes';

-- Verify the update
-- SELECT id, ten, duration FROM ctf;

