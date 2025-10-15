# Supabase Database Setup Instructions

## Current Status
The OptiMail application has been configured with Supabase credentials, but the database tables may not have been created yet.

## Option 1: Setup via Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `ryqgkywrpuondmpfmhca`
3. **Navigate to SQL Editor**
4. **Run the schema from `supabase-schema.sql`**:
   - Copy the entire content from `supabase-schema.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute all the table creation commands

## Option 2: Setup via Supabase CLI

If you have Supabase CLI installed:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref ryqgkywrpuondmpfmhca

# Push the schema
supabase db push
```

## Option 3: Manual Table Creation

If you prefer to create tables manually, you need these essential tables:

### 1. waitlist_users (for basic functionality)
```sql
create table public.waitlist_users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  referral_source text,
  metadata jsonb,
  subscribed boolean default false not null
);
```

### 2. users (for authenticated users)
```sql
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  username text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

## Verification

After creating the tables, run the diagnostic test again:
- Open: http://localhost:3002/diagnostic-test.html
- Click "Test Supabase Only"
- Should show "✅ Connection successful"

## Notes

- The `supabase-schema.sql` file contains the complete schema with all tables, indexes, RLS policies, and functions
- This includes OptiMail-specific tables like `mailgent_history`, `mailgent_templates`, etc.
- Row Level Security (RLS) is enabled for all tables for proper authentication
- The schema includes proper indexes for performance

## Troubleshooting

If you still get errors after creating tables:
1. Check RLS policies are created correctly
2. Verify the anon key has proper permissions
3. Test with a simple insert to `waitlist_users` table
