-- Create the analytics_events table
create table public.analytics_events (
  id uuid default gen_random_uuid() primary key,
  session_id uuid not null,
  event_type text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.analytics_events enable row level security;

-- Create policies
-- Allow anonymous inserts (for tracking)
create policy "Allow anonymous inserts"
  on public.analytics_events for insert
  with check (true);

-- Allow admins to view all events (adjust logic as needed for your auth system)
create policy "Allow read access for all"
  on public.analytics_events for select
  using (true);
