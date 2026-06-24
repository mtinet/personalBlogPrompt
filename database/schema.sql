-- =========================================================
-- 개인 블로그 스키마 (Supabase SQL Editor에서 1회 실행)
-- 실행 전: 아래 'owner@example.com' 을 본인(관리자) 이메일로 바꾸세요.
-- =========================================================

-- 관리자 판별 ------------------------------------------------
create table if not exists admins (email text primary key);
insert into admins(email) values ('owner@example.com') on conflict do nothing;

create or replace function is_admin() returns boolean
  language sql security definer stable as $$
  select exists(select 1 from admins where email = auth.jwt()->>'email');
$$;

-- 글 --------------------------------------------------------
create table if not exists posts (
  id serial primary key,
  title text not null,
  body text not null default '',
  files jsonb not null default '[]',          -- [{url,name}, ...]
  tags text[] not null default '{}',
  pinned boolean not null default false,
  comments_locked boolean not null default false,
  comments_hidden boolean not null default false,
  author_name text,
  author_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table posts enable row level security;
drop policy if exists posts_read on posts;
drop policy if exists posts_write on posts;
create policy posts_read  on posts for select to anon, authenticated using (true);
create policy posts_write on posts for all    to authenticated using (is_admin()) with check (is_admin());

-- 댓글 ------------------------------------------------------
create table if not exists comments (
  id serial primary key,
  post_id int not null references posts(id) on delete cascade,
  author_id uuid,
  author_name text,
  body text not null,
  created_at timestamptz default now()
);
create index if not exists idx_comments_post on comments(post_id, created_at);
alter table comments enable row level security;
drop policy if exists comments_read on comments;
drop policy if exists comments_insert on comments;
drop policy if exists comments_del on comments;
create policy comments_read   on comments for select to anon, authenticated using (true);
create policy comments_insert on comments for insert to anon, authenticated
  with check (coalesce((select not comments_locked from posts where id = post_id), false));
create policy comments_del    on comments for delete to authenticated using (is_admin());

-- 스토리지(공개 버킷 'blog') --------------------------------
insert into storage.buckets (id, name, public) values ('blog','blog',true) on conflict do nothing;
drop policy if exists blog_read   on storage.objects;
drop policy if exists blog_write  on storage.objects;
drop policy if exists blog_update on storage.objects;
drop policy if exists blog_delete on storage.objects;
create policy blog_read   on storage.objects for select to anon, authenticated using (bucket_id = 'blog');
create policy blog_write  on storage.objects for insert to authenticated with check (bucket_id = 'blog' and is_admin());
create policy blog_update on storage.objects for update to authenticated using (bucket_id = 'blog' and is_admin());
create policy blog_delete on storage.objects for delete to authenticated using (bucket_id = 'blog' and is_admin());

-- 조회수 + 다운로드 횟수 -------------------------------------
alter table posts add column if not exists views int not null default 0;

create or replace function increment_post_view(p_id int) returns void
  language plpgsql security definer set search_path = public as $$
  begin update posts set views = views + 1 where id = p_id; end;
$$;
grant execute on function increment_post_view(int) to anon, authenticated;

create table if not exists file_downloads (
  post_id int not null references posts(id) on delete cascade,
  file_url text not null,
  count int not null default 0,
  primary key (post_id, file_url)
);
alter table file_downloads enable row level security;
drop policy if exists file_downloads_read on file_downloads;
create policy file_downloads_read on file_downloads for select to anon, authenticated using (true);

create or replace function increment_download(p_post_id int, p_url text) returns void
  language plpgsql security definer set search_path = public as $$
  begin
    insert into file_downloads(post_id, file_url, count) values (p_post_id, p_url, 1)
    on conflict (post_id, file_url) do update set count = file_downloads.count + 1;
  end;
$$;
grant execute on function increment_download(int, text) to anon, authenticated;

select '개인 블로그 스키마 적용 완료' as result;
