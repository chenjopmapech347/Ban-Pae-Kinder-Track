-- รันใน Supabase SQL Editor ก่อนใช้งานซิงค์คลาวด์
-- Project Settings → API → คัดลอก URL และ anon key ไปใส่ใน .env

create table if not exists public.kindergarten_snapshots (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.kindergarten_snapshots enable row level security;

-- Demo: เปิดให้อ่าน/เขียนได้ (ปรับเป็น auth จริงก่อนใช้ production)
create policy "Allow public read snapshots"
  on public.kindergarten_snapshots for select
  using (true);

create policy "Allow public write snapshots"
  on public.kindergarten_snapshots for insert
  with check (true);

create policy "Allow public update snapshots"
  on public.kindergarten_snapshots for update
  using (true);
