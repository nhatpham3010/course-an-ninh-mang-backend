-- Migration: Add course_type column to users table
-- Default value: 'free' for existing users and new registrations

-- Add course_type column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'course_type'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN course_type VARCHAR(50) DEFAULT 'free';
        
        -- Update existing users to 'free' if they don't have a course_type
        UPDATE users 
        SET course_type = 'free' 
        WHERE course_type IS NULL;
    END IF;
END $$;

