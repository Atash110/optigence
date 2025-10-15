-- MINIMAL Schema - Just to get diagnostics working
-- Only creates what's absolutely needed for the diagnostic test

-- Create minimal waitlist_users table (ignore if exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'waitlist_users'
    ) THEN
        CREATE TABLE public.waitlist_users (
            id uuid default gen_random_uuid() primary key,
            email text unique not null,
            created_at timestamp with time zone default timezone('utc'::text, now()) not null
        );
        RAISE NOTICE 'Created waitlist_users table';
    ELSE
        RAISE NOTICE 'waitlist_users table already exists';
    END IF;
END $$;

-- Enable RLS and create basic policy
ALTER TABLE public.waitlist_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists, then recreate
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist_users;
CREATE POLICY "Anyone can join waitlist" ON public.waitlist_users
    FOR INSERT WITH CHECK (true);

-- Grant permissions for anon users to insert
GRANT INSERT ON public.waitlist_users TO anon;
GRANT USAGE ON SCHEMA public TO anon;

-- Test query to make sure it works
SELECT COUNT(*) as total_waitlist_entries FROM public.waitlist_users;

SELECT 'Minimal setup complete - diagnostics should work now!' as status;
