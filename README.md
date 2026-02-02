# Todo App with Supabase Authentication

A full-featured Todo application built with Next.js, tRPC, and Supabase, featuring real-time updates and image uploads.

## Features

### Standard Features

1. ✅ **Get User Todos** - View all your todos in a clean, organized interface
2. ✅ **Login User** - Secure authentication with Supabase Auth
3. ✅ **Insert Todo** - Create new todos with title and description
4. ✅ **Update Todo** - Edit todo details and toggle completion status
5. ✅ **Delete Todo** - Remove todos you no longer need
6. ✅ **Insert Images** - Upload and attach images to your todos

### Advanced Features

1. ✅ **Realtime Updates** - See changes instantly across all connected devices
2. ✅ **Multiple User Support** - Secure, isolated todo lists for each user with Row Level Security

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Type Safety**: TypeScript + tRPC
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (for images)
- **Realtime**: Supabase Realtime
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)

## Getting Started

### 1. Clone and Install

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `SUPABASE_SETUP.md` in your Supabase SQL Editor
3. Enable Realtime for the `todos` table in Database → Replication
4. Create a storage bucket named `todo-images` and make it public

### 3. Configure Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Find these values in your Supabase project settings under API.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start using the app.

## Usage

1. **Sign Up**: Create a new account at `/signup`
2. **Sign In**: Log in at `/login`
3. **Create Todos**: Use the form to add new todos
4. **Add Images**: Click "Add Image" to upload photos to your todos
5. **Edit Todos**: Click "Edit" to modify title and description
6. **Complete Todos**: Check the box to mark todos as complete
7. **Delete Todos**: Remove todos you no longer need
8. **Realtime Sync**: Open the app in multiple tabs to see instant updates!

## Project Structure

```
src/
├── app/
│   ├── _components/
│   │   └── todo-list.tsx      # Main todo list component with realtime
│   ├── login/
│   │   └── page.tsx            # Login page
│   ├── signup/
│   │   └── page.tsx            # Signup page
│   └── page.tsx                # Home page (protected)
├── lib/
│   └── supabase/
│       ├── client.ts           # Client-side Supabase client
│       ├── server.ts           # Server-side Supabase client
│       └── middleware.ts       # Auth middleware
├── server/
│   └── api/
│       ├── routers/
│       │   └── todo.ts         # Todo tRPC router
│       ├── root.ts             # API root router
│       └── trpc.ts             # tRPC setup with auth
└── middleware.ts               # Next.js middleware for auth
```

## Security Features

- **Row Level Security (RLS)**: Users can only access their own todos
- **Protected Routes**: Automatic redirect to login for unauthenticated users
- **Secure Image Storage**: Images are stored with user-specific paths
- **Input Validation**: All inputs are validated with Zod schemas
- **Type Safety**: End-to-end type safety with TypeScript and tRPC

## API Endpoints (tRPC)

- `todo.getAll` - Get all todos for the current user
- `todo.create` - Create a new todo
- `todo.update` - Update a todo
- `todo.delete` - Delete a todo
- `todo.uploadImage` - Upload an image to a todo
- `todo.removeImage` - Remove an image from a todo

## Troubleshooting

### Realtime not working?

- Ensure you've enabled Realtime for the `todos` table in Supabase
- Check your browser console for connection errors

### Images not uploading?

- Verify the `todo-images` bucket exists and is public
- Check file size (max 5MB) and type (must be an image)

### Authentication issues?

- Make sure your environment variables are set correctly
- Check that your Supabase project URL and anon key are valid

## Learn More

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

To learn more about the T3 Stack and technologies used:

- [Next.js](https://nextjs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)
- [Supabase](https://supabase.com)
- [Documentation](https://create.t3.gg/)
