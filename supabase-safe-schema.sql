-- Safe Supabase Schema Setup (checks for existing tables/columns)
-- Run this in your Supabase SQL Editor

-- Enable Row Level Security on auth.users if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'auth' AND tablename = 'users'
    ) THEN
        RAISE NOTICE 'auth.users table does not exist, skipping RLS enable';
    ELSE
        ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS public.users (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  username text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create waitlist_users table if not exists
CREATE TABLE IF NOT EXISTS public.waitlist_users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  referral_source text,
  metadata jsonb
);

-- Add subscribed column to waitlist_users if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'waitlist_users' 
        AND column_name = 'subscribed'
    ) THEN
        ALTER TABLE public.waitlist_users ADD COLUMN subscribed boolean default false not null;
    END IF;
END $$;

-- Create conversations table if not exists
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  module text not null check (module in ('superficial', 'mailgent', 'shopora', 'jobvera', 'travelbuddy')),
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create messages table if not exists
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create user_preferences table if not exists
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade unique not null,
  theme text default 'system' check (theme in ('light', 'dark', 'system')) not null,
  language text default 'en' not null,
  ai_model text default 'gpt-4-turbo-preview' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Mailgent tables if they don't exist
CREATE TABLE IF NOT EXISTS public.mailgent_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  email_type text not null check (email_type in ('compose', 'reply', 'summarize', 'rewrite', 'template')),
  user_input text not null,
  ai_output text not null,
  tone text,
  intent text,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE IF NOT EXISTS public.mailgent_memories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  embedding vector(1536),
  context text not null,
  email_pattern text,
  frequency_score integer default 1,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now') not null
);

CREATE TABLE IF NOT EXISTS public.mailgent_templates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade,
  name text not null,
  description text,
  category text not null check (category in ('business', 'personal', 'marketing', 'support', 'custom')),
  template_content text not null,
  tone text,
  is_public boolean default false,
  usage_count integer default 0,
  tier_required text default 'Free' check (tier_required in ('Free', 'Pro', 'Elite')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE IF NOT EXISTS public.mailgent_tone_analysis (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  email_content text not null,
  sentiment text not null check (sentiment in ('positive', 'neutral', 'negative')),
  emotion text not null,
  confidence_score float not null check (confidence_score >= 0 and confidence_score <= 1),
  formality_level text not null check (formality_level in ('very_formal', 'formal', 'neutral', 'casual', 'very_casual')),
  urgency_level text not null check (urgency_level in ('low', 'medium', 'high')),
  suggestions jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS waitlist_users_email_idx ON public.waitlist_users(email);
CREATE INDEX IF NOT EXISTS waitlist_users_created_at_idx ON public.waitlist_users(created_at desc);
CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS conversations_module_idx ON public.conversations(module);
CREATE INDEX IF NOT EXISTS conversations_updated_at_idx ON public.conversations(updated_at desc);
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_mailgent_history_user_id ON public.mailgent_history(user_id);
CREATE INDEX IF NOT EXISTS idx_mailgent_history_created_at ON public.mailgent_history(created_at desc);
CREATE INDEX IF NOT EXISTS idx_mailgent_memories_user_id ON public.mailgent_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_mailgent_templates_user_id ON public.mailgent_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_mailgent_templates_category ON public.mailgent_templates(category);
CREATE INDEX IF NOT EXISTS idx_mailgent_templates_public ON public.mailgent_templates(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_mailgent_tone_analysis_user_id ON public.mailgent_tone_analysis(user_id);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mailgent_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mailgent_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mailgent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mailgent_tone_analysis ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (only if they don't exist)

-- Waitlist policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'waitlist_users' AND policyname = 'Anyone can join waitlist'
    ) THEN
        CREATE POLICY "Anyone can join waitlist" ON public.waitlist_users
            FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'waitlist_users' AND policyname = 'Service role can view waitlist'
    ) THEN
        CREATE POLICY "Service role can view waitlist" ON public.waitlist_users
            FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;
END $$;

-- Users policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can view own profile'
    ) THEN
        CREATE POLICY "Users can view own profile" ON public.users
            FOR SELECT USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile" ON public.users
            FOR UPDATE USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can insert own profile'
    ) THEN
        CREATE POLICY "Users can insert own profile" ON public.users
            FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Special permissions for waitlist (allow anonymous inserts)
GRANT INSERT ON public.waitlist_users TO anon;
GRANT SELECT ON public.waitlist_users TO service_role;

-- Create or replace functions

-- Function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
    new.updated_at = timezone('utc'::text, now());
    RETURN new;
END;
$$ language plpgsql;

-- Create triggers for updated_at (drop and recreate to avoid conflicts)
DROP TRIGGER IF EXISTS handle_users_updated_at ON public.users;
CREATE TRIGGER handle_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_conversations_updated_at ON public.conversations;
CREATE TRIGGER handle_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER handle_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to automatically create user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, email, username, full_name)
    VALUES (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'full_name'
    );
    RETURN new;
END;
$$ language plpgsql security definer;

-- Create trigger to automatically create user profiles (drop and recreate)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Success message
SELECT 'Database setup completed successfully! All tables and policies are now in place.' as status;
