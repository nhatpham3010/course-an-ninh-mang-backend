-- Add answer columns to ctf_user table
ALTER TABLE ctf_user
ADD COLUMN IF NOT EXISTS dap_an TEXT,
ADD COLUMN IF NOT EXISTS dap_an_file TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_ctf_user_user_ctf ON ctf_user(user_id, ctf_id);

