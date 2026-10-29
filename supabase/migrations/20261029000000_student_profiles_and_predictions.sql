-- StudentInsight: profile and prediction-history schema.
-- All student-owned records are protected by row-level security.

create table if not exists public.student_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  student_id text not null unique,
  full_name text not null default 'Student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_id_format check (student_id ~ '^STU-[A-F0-9]{12}$')
);

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  features jsonb not null,
  predicted_score numeric(5,2) not null check (predicted_score >= 0 and predicted_score <= 100),
  model_name text not null,
  dataset text not null,
  guidance jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists predictions_user_created_idx
  on public.predictions (user_id, created_at desc);

alter table public.student_profiles enable row level security;
alter table public.predictions enable row level security;

drop policy if exists "Students can read their own profile" on public.student_profiles;
create policy "Students can read their own profile"
  on public.student_profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Students can update their own profile" on public.student_profiles;
create policy "Students can update their own profile"
  on public.student_profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Students can read their own predictions" on public.predictions;
create policy "Students can read their own predictions"
  on public.predictions for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Students can insert their own predictions" on public.predictions;
create policy "Students can insert their own predictions"
  on public.predictions for insert
  to authenticated
  with check (auth.uid() = user_id);

create or replace function public.handle_new_student()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  supplied_student_id text;
  supplied_full_name text;
begin
  supplied_student_id := upper(coalesce(new.raw_user_meta_data ->> 'student_id', ''));
  supplied_full_name := trim(coalesce(new.raw_user_meta_data ->> 'full_name', 'Student'));

  if supplied_student_id !~ '^STU-[A-F0-9]{12}$' then
    raise exception 'A valid generated student ID is required';
  end if;

  insert into public.student_profiles (id, student_id, full_name)
  values (new.id, supplied_student_id, coalesce(nullif(supplied_full_name, ''), 'Student'));

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_student_profile on auth.users;
create trigger on_auth_user_created_student_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_student();

grant select, update on public.student_profiles to authenticated;
grant select, insert on public.predictions to authenticated;
