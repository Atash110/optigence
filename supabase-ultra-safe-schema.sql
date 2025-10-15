-- Ultra-Safe Supabase Schema Setup
-- This version handles all edge cases including existing columns

-- First, let's check what tables and columns already exist
SELECT 
    t.table_name,
    string_agg(c.column_name, ', ' ORDER BY c.ordinal_position) as columns
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name 
    AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name
ORDER BY t.table_name;

-- Now let's safely add only what's missing

-- Create waitlist_users table if not exists
CREATE TABLE IF NOT EXISTS public.waitlist_users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Safely add columns to waitlist_users
DO $$ 
BEGIN
    -- Add referral_source if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'waitlist_users' 
        AND column_name = 'referral_source'
    ) THEN
        ALTER TABLE public.waitlist_users ADD COLUMN referral_source text;
        RAISE NOTICE 'Added referral_source column to waitlist_users';
    ELSE
        RAISE NOTICE 'referral_source column already exists in waitlist_users';
    END IF;
    
    -- Add metadata if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'waitlist_users' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.waitlist_users ADD COLUMN metadata jsonb;
        RAISE NOTICE 'Added metadata column to waitlist_users';
    ELSE
        RAISE NOTICE 'metadata column already exists in waitlist_users';
    END IF;
    
    -- Add subscribed if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'waitlist_users' 
        AND column_name = 'subscribed'
    ) THEN
        ALTER TABLE public.waitlist_users ADD COLUMN subscribed boolean default false not null;
        RAISE NOTICE 'Added subscribed column to waitlist_users';
    ELSE
        RAISE NOTICE 'subscribed column already exists in waitlist_users';
    END IF;
END $$;

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS public.users (
  id uuid primary key,
  email text unique not null,
  username text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add foreign key constraint to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%auth_users%'
    ) THEN
        -- Only add foreign key if auth.users table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
            ALTER TABLE public.users ADD CONSTRAINT users_id_fkey 
                FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added foreign key constraint to users table';
        ELSE
            RAISE NOTICE 'auth.users table does not exist, skipping foreign key';
        END IF;
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists on users table';
    END IF;
END $$;

-- Create other essential tables
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  module text not null,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid not null,
  role text not null,
  content text not null,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
ALTER TABLE public.waitlist_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for waitlist_users
DO $$ 
BEGIN
    -- Policy for anyone to join waitlist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'waitlist_users' 
        AND policyname = 'Anyone can join waitlist'
    ) THEN
        CREATE POLICY "Anyone can join waitlist" ON public.waitlist_users
            FOR INSERT WITH CHECK (true);
        RAISE NOTICE 'Created waitlist insert policy';
    ELSE
        RAISE NOTICE 'Waitlist insert policy already exists';
    END IF;
    
    -- Policy for service role to view waitlist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'waitlist_users' 
        AND policyname = 'Service role can view waitlist'
    ) THEN
        CREATE POLICY "Service role can view waitlist" ON public.waitlist_users
            FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');
        RAISE NOTICE 'Created waitlist view policy';
    ELSE
        RAISE NOTICE 'Waitlist view policy already exists';
    END IF;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT INSERT ON public.waitlist_users TO anon;

-- Create essential indexes
CREATE INDEX IF NOT EXISTS waitlist_users_email_idx ON public.waitlist_users(email);
CREATE INDEX IF NOT EXISTS waitlist_users_created_at_idx ON public.waitlist_users(created_at desc);

-- Final verification - show what we have
SELECT 'Setup completed! Here are your tables:' as status;

SELECT 
    t.table_name,
    string_agg(c.column_name, ', ' ORDER BY c.ordinal_position) as columns
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name 
    AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name
ORDER BY t.table_name;
