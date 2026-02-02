# Supabase Database Schema

## Setup Instructions

1. Create a new Supabase project at https://supabase.com
2. Run the following SQL in your Supabase SQL Editor:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create todos table
create table todos (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  completed boolean default false,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table todos enable row level security;

-- Create policies
-- Users can view their own todos
create policy "Users can view their own todos"
  on todos for select
  using (auth.uid() = user_id);

-- Users can insert their own todos
create policy "Users can insert their own todos"
  on todos for insert
  with check (auth.uid() = user_id);

-- Users can update their own todos
create policy "Users can update their own todos"
  on todos for update
  using (auth.uid() = user_id);

-- Users can delete their own todos
create policy "Users can delete their own todos"
  on todos for delete
  using (auth.uid() = user_id);

-- Create updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language 'plpgsql';

create trigger update_todos_updated_at before update on todos
  for each row execute procedure update_updated_at_column();

-- Create storage bucket for todo images
insert into storage.buckets (id, name, public)
values ('todo-images', 'todo-images', true);

-- Storage policies for todo images
create policy "Users can upload their own images"
  on storage.objects for insert
  with check (
    bucket_id = 'todo-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view their own images"
  on storage.objects for select
  using (
    bucket_id = 'todo-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own images"
  on storage.objects for delete
  using (
    bucket_id = 'todo-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Anyone can view public images"
  on storage.objects for select
  using (bucket_id = 'todo-images');
```

## Realtime Setup

Enable realtime for the todos table in your Supabase dashboard:

1. Go to Database → Replication
2. Enable realtime for the `todos` table

## Environment Variables

Add these to your `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings under API.
