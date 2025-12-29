-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  bio text,
  avatar_url text,
  location text,
  language text default 'en',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create books table for book catalog
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  isbn text unique,
  image_url text,
  description text,
  publication_year integer,
  created_at timestamp with time zone default now()
);

-- Create user_books table for bookshelves
create table if not exists public.user_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  status text default 'reading' check (status in ('reading', 'completed', 'want_to_read', 'not_interested')),
  rating integer check (rating >= 1 and rating <= 5),
  review text,
  added_at timestamp with time zone default now(),
  unique(user_id, book_id)
);

-- Create posts table for community feed
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid references public.books(id) on delete set null,
  content text not null,
  image_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create comments table
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create likes table
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id, post_id)
);

-- Create follows table for community
create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(follower_id, following_id),
  check (follower_id != following_id)
);

-- Create book_trades table
create table if not exists public.book_trades (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id),
  owner_id uuid not null references auth.users(id) on delete cascade,
  status text default 'available' check (status in ('available', 'pending', 'traded', 'cancelled')),
  price_cents integer,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.user_books enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.follows enable row level security;
alter table public.book_trades enable row level security;

-- Profiles RLS Policies
create policy "profiles_select_public"
  on public.profiles for select
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Books RLS Policies (public read)
create policy "books_select_all"
  on public.books for select
  using (true);

create policy "books_insert_admin"
  on public.books for insert
  with check (false);

-- User Books RLS Policies
create policy "user_books_select_own"
  on public.user_books for select
  using (auth.uid() = user_id);

create policy "user_books_insert_own"
  on public.user_books for insert
  with check (auth.uid() = user_id);

create policy "user_books_update_own"
  on public.user_books for update
  using (auth.uid() = user_id);

create policy "user_books_delete_own"
  on public.user_books for delete
  using (auth.uid() = user_id);

-- Posts RLS Policies
create policy "posts_select_all"
  on public.posts for select
  using (true);

create policy "posts_insert_own"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "posts_update_own"
  on public.posts for update
  using (auth.uid() = user_id);

create policy "posts_delete_own"
  on public.posts for delete
  using (auth.uid() = user_id);

-- Comments RLS Policies
create policy "comments_select_all"
  on public.comments for select
  using (true);

create policy "comments_insert_own"
  on public.comments for insert
  with check (auth.uid() = user_id);

create policy "comments_update_own"
  on public.comments for update
  using (auth.uid() = user_id);

create policy "comments_delete_own"
  on public.comments for delete
  using (auth.uid() = user_id);

-- Likes RLS Policies
create policy "likes_select_all"
  on public.likes for select
  using (true);

create policy "likes_insert_own"
  on public.likes for insert
  with check (auth.uid() = user_id);

create policy "likes_delete_own"
  on public.likes for delete
  using (auth.uid() = user_id);

-- Follows RLS Policies
create policy "follows_select_all"
  on public.follows for select
  using (true);

create policy "follows_insert_own"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "follows_delete_own"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- Book Trades RLS Policies
create policy "book_trades_select_all"
  on public.book_trades for select
  using (true);

create policy "book_trades_insert_own"
  on public.book_trades for insert
  with check (auth.uid() = owner_id);

create policy "book_trades_update_own"
  on public.book_trades for update
  using (auth.uid() = owner_id);

create policy "book_trades_delete_own"
  on public.book_trades for delete
  using (auth.uid() = owner_id);
