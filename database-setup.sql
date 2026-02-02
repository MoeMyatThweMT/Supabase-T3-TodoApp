-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create todos table with date and subtasks support
create table if not exists todos (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  completed boolean default false,
  due_date date,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create subtasks table
create table if not exists subtasks (
  id uuid default uuid_generate_v4() primary key,
  todo_id uuid references todos(id) on delete cascade not null,
  title text not null,
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) for todos
alter table todos enable row level security;

-- Enable Row Level Security (RLS) for subtasks
alter table subtasks enable row level security;

-- Todos policies
create policy "Users can view their own todos"
  on todos for select
  using (auth.uid() = user_id);

create policy "Users can insert their own todos"
  on todos for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own todos"
  on todos for update
  using (auth.uid() = user_id);

create policy "Users can delete their own todos"
  on todos for delete
  using (auth.uid() = user_id);

-- Subtasks policies
create policy "Users can view their own subtasks"
  on subtasks for select
  using (auth.uid() = (select user_id from todos where id = todo_id));

create policy "Users can insert their own subtasks"
  on subtasks for insert
  with check (auth.uid() = (select user_id from todos where id = todo_id));

create policy "Users can update their own subtasks"
  on subtasks for update
  using (auth.uid() = (select user_id from todos where id = todo_id));

create policy "Users can delete their own subtasks"
  on subtasks for delete
  using (auth.uid() = (select user_id from todos where id = todo_id));

-- Create updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language 'plpgsql';

-- Create triggers
drop trigger if exists update_todos_updated_at on todos;
create trigger update_todos_updated_at before update on todos
  for each row execute procedure update_updated_at_column();

drop trigger if exists update_subtasks_updated_at on subtasks;
create trigger update_subtasks_updated_at before update on subtasks
  for each row execute procedure update_updated_at_column();

-- Create storage bucket for todo images
insert into storage.buckets (id, name, public)
values ('todo-images', 'todo-images', true)
on conflict (id) do nothing;

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
