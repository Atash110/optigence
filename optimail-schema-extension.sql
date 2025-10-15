-- OptiMail Schema Extensions
-- Additional tables for OptiMail features beyond Mailgent

-- User profiles with OptiMail-specific preferences
create table if not exists public.user_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade unique not null,
  signature_html text,
  default_tone text default 'professional' check (default_tone in ('professional', 'casual', 'friendly', 'formal', 'creative')),
  languages text[] default array['en'],
  time_windows jsonb default '{"morning": {"start": "09:00", "end": "12:00"}, "afternoon": {"start": "13:00", "end": "17:00"}}',
  confidence_auto_send float default 0.95 check (confidence_auto_send >= 0 and confidence_auto_send <= 1),
  timezone text default 'UTC',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Contact interaction profiles for personalization
create table if not exists public.contacts_profile (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  contact_email text not null,
  contact_name text,
  tone_override text check (tone_override in ('professional', 'casual', 'friendly', 'formal', 'creative')),
  language_override text,
  trust_level text default 'medium' check (trust_level in ('low', 'medium', 'high')),
  interaction_count integer default 1,
  last_interaction timestamp with time zone default timezone('utc'::text, now()) not null,
  response_patterns jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, contact_email)
);

-- Enhanced templates with usage tracking and AI generation metadata
create table if not exists public.templates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade,
  title text not null,
  content text not null,
  intent text not null check (intent in ('reply', 'compose', 'follow_up', 'introduction', 'meeting', 'thank_you', 'apology', 'request')),
  recipients text[],
  topic_tags text[],
  usage_count integer default 0,
  confidence_score float default 0.8,
  auto_generated boolean default false,
  ai_model text,
  is_public boolean default false,
  tier_required text default 'Free' check (tier_required in ('Free', 'Pro', 'Elite')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Events log for all OptiMail actions and diagnostics
create table if not exists public.events_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade,
  action text not null,
  component text not null,
  status text not null check (status in ('success', 'error', 'pending', 'cancelled')),
  details jsonb,
  latency_ms integer,
  tokens_used integer,
  model_used text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Calendar integrations and OAuth tokens
create table if not exists public.calendar_integrations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade unique not null,
  provider text not null default 'google' check (provider in ('google', 'outlook', 'apple')),
  access_token text,
  refresh_token text,
  expires_at timestamp with time zone,
  scope text[],
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Cross-module routing history for learning
create table if not exists public.cross_module_routes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  source_module text not null default 'optimail',
  target_module text not null check (target_module in ('optimail', 'optitrip', 'optishop', 'optihire')),
  intent text not null,
  entities jsonb,
  success boolean default false,
  user_feedback integer check (user_feedback >= 1 and user_feedback <= 5),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Voice transcription cache
create table if not exists public.voice_transcriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  audio_hash text not null,
  transcription text not null,
  confidence_score float,
  language text default 'en',
  provider text not null check (provider in ('whisper')),
  duration_seconds float,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, audio_hash)
);

-- Create indexes for performance
create index if not exists idx_user_profiles_user_id on public.user_profiles(user_id);
create index if not exists idx_contacts_profile_user_id on public.contacts_profile(user_id);
create index if not exists idx_contacts_profile_email on public.contacts_profile(contact_email);
create index if not exists idx_templates_user_id on public.templates(user_id);
create index if not exists idx_templates_intent on public.templates(intent);
create index if not exists idx_templates_public on public.templates(is_public) where is_public = true;
create index if not exists idx_events_log_user_id on public.events_log(user_id);
create index if not exists idx_events_log_created_at on public.events_log(created_at desc);
create index if not exists idx_events_log_component on public.events_log(component);
create index if not exists idx_calendar_integrations_user_id on public.calendar_integrations(user_id);
create index if not exists idx_cross_module_routes_user_id on public.cross_module_routes(user_id);
create index if not exists idx_voice_transcriptions_user_id on public.voice_transcriptions(user_id);
create index if not exists idx_voice_transcriptions_hash on public.voice_transcriptions(audio_hash);

-- Enable Row Level Security
alter table public.user_profiles enable row level security;
alter table public.contacts_profile enable row level security;
alter table public.templates enable row level security;
alter table public.events_log enable row level security;
alter table public.calendar_integrations enable row level security;
alter table public.cross_module_routes enable row level security;
alter table public.voice_transcriptions enable row level security;

-- RLS Policies for user_profiles
create policy "Users can view own profile" on public.user_profiles
  for select using (auth.uid() = user_id);
create policy "Users can insert own profile" on public.user_profiles
  for insert with check (auth.uid() = user_id);
create policy "Users can update own profile" on public.user_profiles
  for update using (auth.uid() = user_id);

-- RLS Policies for contacts_profile
create policy "Users can view own contacts" on public.contacts_profile
  for select using (auth.uid() = user_id);
create policy "Users can insert own contacts" on public.contacts_profile
  for insert with check (auth.uid() = user_id);
create policy "Users can update own contacts" on public.contacts_profile
  for update using (auth.uid() = user_id);

-- RLS Policies for templates
create policy "Users can view public templates and own" on public.templates
  for select using (is_public = true or auth.uid() = user_id);
create policy "Users can insert own templates" on public.templates
  for insert with check (auth.uid() = user_id);
create policy "Users can update own templates" on public.templates
  for update using (auth.uid() = user_id);
create policy "Users can delete own templates" on public.templates
  for delete using (auth.uid() = user_id);

-- RLS Policies for events_log
create policy "Users can view own events" on public.events_log
  for select using (auth.uid() = user_id or user_id is null);
create policy "System can insert events" on public.events_log
  for insert with check (true);

-- RLS Policies for calendar_integrations
create policy "Users can view own calendar integrations" on public.calendar_integrations
  for select using (auth.uid() = user_id);
create policy "Users can manage own calendar integrations" on public.calendar_integrations
  for all using (auth.uid() = user_id);

-- RLS Policies for cross_module_routes
create policy "Users can view own routes" on public.cross_module_routes
  for select using (auth.uid() = user_id);
create policy "Users can insert own routes" on public.cross_module_routes
  for insert with check (auth.uid() = user_id);

-- RLS Policies for voice_transcriptions
create policy "Users can view own transcriptions" on public.voice_transcriptions
  for select using (auth.uid() = user_id);
create policy "Users can insert own transcriptions" on public.voice_transcriptions
  for insert with check (auth.uid() = user_id);

-- Triggers for updated_at timestamps
create trigger handle_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.handle_updated_at();

create trigger handle_contacts_profile_updated_at
  before update on public.contacts_profile
  for each row execute function public.handle_updated_at();

create trigger handle_templates_updated_at
  before update on public.templates
  for each row execute function public.handle_updated_at();

create trigger handle_calendar_integrations_updated_at
  before update on public.calendar_integrations
  for each row execute function public.handle_updated_at();

-- Grant permissions
grant all on public.user_profiles to authenticated;
grant all on public.contacts_profile to authenticated;
grant all on public.templates to authenticated;
grant all on public.events_log to authenticated;
grant all on public.calendar_integrations to authenticated;
grant all on public.cross_module_routes to authenticated;
grant all on public.voice_transcriptions to authenticated;

-- Allow anonymous to view public templates
grant select on public.templates to anon;

-- Functions for OptiMail operations

-- Function to get or create user profile
create or replace function get_user_profile(user_id_param uuid)
returns public.user_profiles
language plpgsql
security definer
as $$
declare
  profile public.user_profiles;
begin
  select * into profile from public.user_profiles where user_id = user_id_param;
  
  if not found then
    insert into public.user_profiles (user_id) 
    values (user_id_param)
    returning * into profile;
  end if;
  
  return profile;
end;
$$;

-- Function to update contact interaction
create or replace function update_contact_interaction(
  user_id_param uuid,
  contact_email_param text,
  contact_name_param text default null
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.contacts_profile (user_id, contact_email, contact_name, interaction_count, last_interaction)
  values (user_id_param, contact_email_param, contact_name_param, 1, now())
  on conflict (user_id, contact_email) 
  do update set 
    interaction_count = contacts_profile.interaction_count + 1,
    last_interaction = now(),
    contact_name = coalesce(excluded.contact_name, contacts_profile.contact_name);
end;
$$;

-- Function to log OptiMail events
create or replace function log_optimail_event(
  user_id_param uuid,
  action_param text,
  component_param text,
  status_param text,
  details_param jsonb default null,
  latency_ms_param integer default null,
  tokens_used_param integer default null,
  model_used_param text default null
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.events_log (
    user_id, action, component, status, details, 
    latency_ms, tokens_used, model_used
  )
  values (
    user_id_param, action_param, component_param, status_param, 
    details_param, latency_ms_param, tokens_used_param, model_used_param
  );
end;
$$;

-- Function to get template suggestions
create or replace function get_template_suggestions(
  user_id_param uuid,
  intent_param text,
  limit_param integer default 5
)
returns table(
  id uuid,
  title text,
  content text,
  usage_count integer,
  confidence_score float
)
language plpgsql
security definer
as $$
begin
  return query
  select t.id, t.title, t.content, t.usage_count, t.confidence_score
  from public.templates t
  where (t.user_id = user_id_param or t.is_public = true)
    and t.intent = intent_param
  order by 
    case when t.user_id = user_id_param then 1 else 2 end,
    t.usage_count desc,
    t.confidence_score desc
  limit limit_param;
end;
$$;

-- Function to increment template usage
create or replace function increment_template_usage(template_id_param uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.templates 
  set 
    usage_count = usage_count + 1,
    updated_at = now()
  where id = template_id_param;
end;
$$;
