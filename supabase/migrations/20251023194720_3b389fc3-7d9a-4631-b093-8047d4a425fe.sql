-- Create table for cedula validation rate limiting
create table if not exists public.cedula_validation_log (
  id uuid primary key default gen_random_uuid(),
  ip_address text not null,
  cedula text not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.cedula_validation_log enable row level security;

-- Policy to allow the function to insert
create policy "System can insert cedula validation logs"
on public.cedula_validation_log
for insert
with check (true);

-- Policy to allow admins to view logs
create policy "Admins can view cedula validation logs"
on public.cedula_validation_log
for select
using (public.has_role(auth.uid(), 'admin'::app_role));

-- Create index for performance
create index idx_cedula_validation_log_ip_created 
on public.cedula_validation_log(ip_address, created_at);