-- ============================================================================
-- TechDudes Internship & Certificate Portal — schema
-- Run via: supabase db push   (or paste into the SQL editor)
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- profiles: one row per authenticated user (student or admin)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  college text not null,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: select own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);

-- admins can read every profile (needed for the admin panel)
create policy "profiles: admin select all" on public.profiles
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ----------------------------------------------------------------------------
-- internships: the reusable "domain" catalog (IoT, Web Dev, Python, AI, ML...)
-- ----------------------------------------------------------------------------
create table if not exists public.internships (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  short_description text not null,
  long_description text not null,
  duration_days int not null,
  certificate_fee_paise int not null,        -- e.g. 29900 = ₹299.00
  pass_mark_percent int not null default 60,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.internships enable row level security;

create policy "internships: public read active" on public.internships
  for select using (is_active = true or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

create policy "internships: admin write" on public.internships
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ----------------------------------------------------------------------------
-- modules: ordered learning content per internship
-- ----------------------------------------------------------------------------
create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  internship_id uuid not null references public.internships(id) on delete cascade,
  order_index int not null,
  title text not null,
  description text not null,
  content text not null,          -- markdown/rich text
  created_at timestamptz not null default now(),
  unique (internship_id, order_index)
);

alter table public.modules enable row level security;

create policy "modules: public read" on public.modules for select using (true);

create policy "modules: admin write" on public.modules
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ----------------------------------------------------------------------------
-- quiz_questions: correct_option is NEVER selected by the client (see RLS)
-- ----------------------------------------------------------------------------
create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  internship_id uuid not null references public.internships(id) on delete cascade,
  order_index int not null,
  question text not null,
  options jsonb not null,          -- ["opt a", "opt b", "opt c", "opt d"]
  correct_option int not null,     -- index into options — server-only column
  created_at timestamptz not null default now()
);

alter table public.quiz_questions enable row level security;

-- Students are NEVER granted select on this table directly.
-- The frontend calls the `get_quiz_questions` RPC below, which strips
-- correct_option before returning rows. Only admins can select/write raw rows.
create policy "quiz_questions: admin all" on public.quiz_questions
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ----------------------------------------------------------------------------
-- enrollments: a student's run of one internship, with locked start/end dates
-- ----------------------------------------------------------------------------
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  internship_id uuid not null references public.internships(id),
  start_date date not null,
  end_date date not null,
  duration_days int not null,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'completed', 'certificate_scheduled', 'certificate_issued')),
  modules_completed boolean not null default false,
  quiz_passed boolean not null default false,
  quiz_score int,
  quiz_percent int,
  payment_verified boolean not null default false,
  created_at timestamptz not null default now(),
  unique (student_id, internship_id, start_date)
);

alter table public.enrollments enable row level security;

create policy "enrollments: student select own" on public.enrollments
  for select using (auth.uid() = student_id);

create policy "enrollments: student insert own" on public.enrollments
  for insert with check (auth.uid() = student_id);

-- Students may NOT update enrollments directly — status/progress fields are
-- server-controlled (via SECURITY DEFINER RPCs / edge functions) so the
-- frontend cannot fake completion, quiz score, or payment status.
create policy "enrollments: admin all" on public.enrollments
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ----------------------------------------------------------------------------
-- module_progress: per-student, per-module completion (server-validated)
-- ----------------------------------------------------------------------------
create table if not exists public.module_progress (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  unique (enrollment_id, module_id)
);

alter table public.module_progress enable row level security;

create policy "module_progress: student select own" on public.module_progress
  for select using (
    exists (select 1 from public.enrollments e where e.id = enrollment_id and e.student_id = auth.uid())
  );

create policy "module_progress: admin all" on public.module_progress
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
-- Note: no student INSERT/UPDATE policy — completion is only ever written by
-- the `mark_module_complete` RPC (SECURITY DEFINER, see below).

-- ----------------------------------------------------------------------------
-- quiz_attempts
-- ----------------------------------------------------------------------------
create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  score int not null,
  total int not null,
  percent int not null,
  passed boolean not null,
  submitted_at timestamptz not null default now()
);

alter table public.quiz_attempts enable row level security;

create policy "quiz_attempts: student select own" on public.quiz_attempts
  for select using (
    exists (select 1 from public.enrollments e where e.id = enrollment_id and e.student_id = auth.uid())
  );

create policy "quiz_attempts: admin all" on public.quiz_attempts
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ----------------------------------------------------------------------------
-- payments — written only by the razorpay-verify-payment edge function
-- (using the service role key, which bypasses RLS)
-- ----------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  razorpay_order_id text not null unique,
  razorpay_payment_id text unique,
  razorpay_signature text,
  amount_paise int not null,
  currency text not null default 'INR',
  status text not null default 'created' check (status in ('created', 'verified', 'failed')),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "payments: student select own" on public.payments
  for select using (
    exists (select 1 from public.enrollments e where e.id = enrollment_id and e.student_id = auth.uid())
  );

create policy "payments: admin all" on public.payments
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ----------------------------------------------------------------------------
-- certificates
-- ----------------------------------------------------------------------------
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade unique,
  certificate_number text not null unique,      -- e.g. TD-2026-0001
  verification_code text not null unique,
  issue_date date not null,
  pdf_path text,                                 -- path in the 'certificates' storage bucket
  status text not null default 'issued' check (status in ('issued', 'revoked')),
  email_sent boolean not null default false,
  email_sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.certificates enable row level security;

create policy "certificates: student select own" on public.certificates
  for select using (
    exists (select 1 from public.enrollments e where e.id = enrollment_id and e.student_id = auth.uid())
  );

-- Public verification is done via the `verify_certificate` RPC (SECURITY DEFINER)
-- so unauthenticated visitors never need a table-level select policy.

create policy "certificates: admin all" on public.certificates
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ----------------------------------------------------------------------------
-- certificate_number sequence
-- ----------------------------------------------------------------------------
create sequence if not exists public.certificate_number_seq start 1;

create or replace function public.next_certificate_number()
returns text
language plpgsql
as $$
declare
  n bigint;
begin
  n := nextval('public.certificate_number_seq');
  return 'TD-' || to_char(now(), 'YYYY') || '-' || lpad(n::text, 4, '0');
end;
$$;

-- ============================================================================
-- RPCs (SECURITY DEFINER) — these are the only way the affected rows change,
-- so a manipulated frontend request cannot fake progress, scores, or eligibility.
-- ============================================================================

-- ---- mark_module_complete --------------------------------------------------
create or replace function public.mark_module_complete(p_enrollment_id uuid, p_module_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_owner uuid;
  v_internship uuid;
  v_total int;
  v_done int;
begin
  select student_id, internship_id into v_owner, v_internship
  from public.enrollments where id = p_enrollment_id;

  if v_owner is null or v_owner <> auth.uid() then
    raise exception 'not authorized';
  end if;

  if not exists (select 1 from public.modules where id = p_module_id and internship_id = v_internship) then
    raise exception 'module does not belong to this internship';
  end if;

  insert into public.module_progress (enrollment_id, module_id, completed, completed_at)
  values (p_enrollment_id, p_module_id, true, now())
  on conflict (enrollment_id, module_id)
  do update set completed = true, completed_at = now();

  select count(*) into v_total from public.modules where internship_id = v_internship;
  select count(*) into v_done from public.module_progress
    where enrollment_id = p_enrollment_id and completed = true;

  if v_done >= v_total then
    update public.enrollments set modules_completed = true,
      status = case when status = 'not_started' then 'in_progress' else status end
      where id = p_enrollment_id;
  end if;
end;
$$;

-- ---- get_quiz_questions: returns questions WITHOUT the correct answer -----
create or replace function public.get_quiz_questions(p_internship_id uuid)
returns table (id uuid, order_index int, question text, options jsonb)
language sql
security definer set search_path = public
as $$
  select id, order_index, question, options
  from public.quiz_questions
  where internship_id = p_internship_id
  order by order_index;
$$;

-- ---- submit_quiz: scores server-side, records attempt, updates enrollment -
create or replace function public.submit_quiz(p_enrollment_id uuid, p_answers jsonb)
-- p_answers shape: [{ "question_id": "uuid", "selected": 2 }, ...]
returns table (score int, total int, percent int, passed boolean)
language plpgsql
security definer set search_path = public
as $$
declare
  v_owner uuid;
  v_internship uuid;
  v_pass_mark int;
  v_total int;
  v_score int := 0;
  v_percent int;
  v_passed boolean;
  a jsonb;
  v_correct int;
begin
  select student_id, internship_id into v_owner, v_internship
  from public.enrollments where id = p_enrollment_id;

  if v_owner is null or v_owner <> auth.uid() then
    raise exception 'not authorized';
  end if;

  select pass_mark_percent into v_pass_mark from public.internships where id = v_internship;
  select count(*) into v_total from public.quiz_questions where internship_id = v_internship;

  if v_total = 0 then
    raise exception 'no quiz configured for this internship';
  end if;

  for a in select * from jsonb_array_elements(p_answers)
  loop
    select correct_option into v_correct from public.quiz_questions
      where id = (a->>'question_id')::uuid and internship_id = v_internship;
    if v_correct is not null and v_correct = (a->>'selected')::int then
      v_score := v_score + 1;
    end if;
  end loop;

  v_percent := round((v_score::numeric / v_total::numeric) * 100);
  v_passed := v_percent >= v_pass_mark;

  insert into public.quiz_attempts (enrollment_id, score, total, percent, passed)
  values (p_enrollment_id, v_score, v_total, v_percent, v_passed);

  update public.enrollments
    set quiz_passed = quiz_passed or v_passed,
        quiz_score = v_score,
        quiz_percent = v_percent
    where id = p_enrollment_id;

  return query select v_score, v_total, v_percent, v_passed;
end;
$$;

-- ---- verify_certificate: public lookup, no auth required -------------------
create or replace function public.verify_certificate(p_code text)
returns table (
  certificate_number text,
  status text,
  student_name text,
  internship_title text,
  start_date date,
  end_date date,
  duration_days int,
  issue_date date
)
language sql
security definer set search_path = public
as $$
  select c.certificate_number, c.status, p.full_name, i.title,
         e.start_date, e.end_date, e.duration_days, c.issue_date
  from public.certificates c
  join public.enrollments e on e.id = c.enrollment_id
  join public.profiles p on p.id = e.student_id
  join public.internships i on i.id = e.internship_id
  where c.verification_code = p_code;
$$;

grant execute on function public.mark_module_complete(uuid, uuid) to authenticated;
grant execute on function public.get_quiz_questions(uuid) to authenticated;
grant execute on function public.submit_quiz(uuid, jsonb) to authenticated;
grant execute on function public.verify_certificate(text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- storage bucket for certificate PDFs (create via dashboard or here)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', true)
on conflict (id) do nothing;
