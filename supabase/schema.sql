-- AdForge V1 schema (spec §6). Run this in the Supabase SQL editor.
-- Tables are RLS-scoped so a user can only touch rows belonging to their
-- own projects. Storage buckets are private; files live under
-- <user_id>/<project_id>/... and are served via signed URLs.

-- ---------------------------------------------------------------- projects
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "projects: own rows"
  on public.projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Helper expression used by all child tables: the row's project must belong
-- to the calling user.

-- ------------------------------------------------------------------ inputs
create table if not exists public.inputs (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects (id) on delete cascade,
  competitor_text text,
  business_text   text,
  uploaded_files  jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now()
);

alter table public.inputs enable row level security;

create policy "inputs: own project rows"
  on public.inputs for all
  using (exists (select 1 from public.projects p
                 where p.id = project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.projects p
                      where p.id = project_id and p.user_id = auth.uid()));

-- ------------------------------------------------------------------ angles
create table if not exists public.angles (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects (id) on delete cascade,
  name          text not null,
  core_message  text not null,
  hook          text not null,
  cta           text not null,
  created_at    timestamptz not null default now()
);

alter table public.angles enable row level security;

create policy "angles: own project rows"
  on public.angles for all
  using (exists (select 1 from public.projects p
                 where p.id = project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.projects p
                      where p.id = project_id and p.user_id = auth.uid()));

-- --------------------------------------------------------------- creatives
create table if not exists public.creatives (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects (id) on delete cascade,
  angle_id      uuid references public.angles (id) on delete set null,
  template_key  text not null,
  state_json    jsonb not null,
  thumbnail_url text,            -- storage path in the exports bucket
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.creatives enable row level security;

create policy "creatives: own project rows"
  on public.creatives for all
  using (exists (select 1 from public.projects p
                 where p.id = project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.projects p
                      where p.id = project_id and p.user_id = auth.uid()));

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists creatives_set_updated_at on public.creatives;
create trigger creatives_set_updated_at
  before update on public.creatives
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------- brand_kits
create table if not exists public.brand_kits (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects (id) on delete cascade,
  logo_path       text,
  color_primary   text,
  color_secondary text,
  color_text      text,
  bg_image_path   text,
  created_at      timestamptz not null default now()
);

alter table public.brand_kits enable row level security;

create policy "brand_kits: own project rows"
  on public.brand_kits for all
  using (exists (select 1 from public.projects p
                 where p.id = project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.projects p
                      where p.id = project_id and p.user_id = auth.uid()));

-- ----------------------------------------------------------------- storage
-- Private buckets: assets (logos, bg images, uploaded docs/screenshots) and
-- exports (rendered PNGs / thumbnails). Object paths start with the owner's
-- user id, which the policies below enforce.
insert into storage.buckets (id, name, public)
  values ('assets', 'assets', false)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('exports', 'exports', false)
  on conflict (id) do nothing;

create policy "storage: own folder select"
  on storage.objects for select to authenticated
  using (bucket_id in ('assets','exports')
         and (storage.foldername(name))[1] = auth.uid()::text);

create policy "storage: own folder insert"
  on storage.objects for insert to authenticated
  with check (bucket_id in ('assets','exports')
              and (storage.foldername(name))[1] = auth.uid()::text);

create policy "storage: own folder update"
  on storage.objects for update to authenticated
  using (bucket_id in ('assets','exports')
         and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id in ('assets','exports')
              and (storage.foldername(name))[1] = auth.uid()::text);

create policy "storage: own folder delete"
  on storage.objects for delete to authenticated
  using (bucket_id in ('assets','exports')
         and (storage.foldername(name))[1] = auth.uid()::text);
