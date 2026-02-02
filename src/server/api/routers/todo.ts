import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const todoRouter = createTRPCRouter({
  // Get all todos for the authenticated user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { data: todos, error } = await ctx.supabase
      .from("todos")
      .select(
        `
        *,
        subtasks (
          id,
          title,
          completed,
          created_at
        )
      `,
      )
      .eq("user_id", ctx.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return todos ?? [];
  }),

  // Create a new todo
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        due_date: z.string().optional(),
        subtasks: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { subtasks, ...todoData } = input;

      const { data, error } = await ctx.supabase
        .from("todos")
        .insert({
          title: todoData.title,
          description: todoData.description,
          due_date: todoData.due_date,
          user_id: ctx.user.id,
          completed: false,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Create subtasks if provided
      if (subtasks && subtasks.length > 0 && data) {
        const subtaskInserts = subtasks.map((title) => ({
          todo_id: data.id,
          title,
          completed: false,
        }));

        await ctx.supabase.from("subtasks").insert(subtaskInserts);
      }

      return data;
    }),

  // Update a todo
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        completed: z.boolean().optional(),
        due_date: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      const { data, error } = await ctx.supabase
        .from("todos")
        .update(updates)
        .eq("id", id)
        .eq("user_id", ctx.user.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    }),

  // Delete a todo
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // First get the todo to check if it has an image
      const { data: todo } = await ctx.supabase
        .from("todos")
        .select("image_url")
        .eq("id", input.id)
        .eq("user_id", ctx.user.id)
        .single();

      // Delete the image from storage if it exists
      if (todo?.image_url) {
        const fileName = todo.image_url.split("/").pop();
        if (fileName) {
          await ctx.supabase.storage
            .from("todo-images")
            .remove([`${ctx.user.id}/${fileName}`]);
        }
      }

      const { error } = await ctx.supabase
        .from("todos")
        .delete()
        .eq("id", input.id)
        .eq("user_id", ctx.user.id);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    }),

  // Upload image for a todo
  uploadImage: protectedProcedure
    .input(
      z.object({
        todoId: z.string().uuid(),
        file: z.object({
          name: z.string(),
          type: z.string(),
          base64: z.string(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Convert base64 to buffer
      const base64Data = input.file.base64.split(",")[1];
      if (!base64Data) {
        throw new Error("Invalid file data");
      }

      const buffer = Buffer.from(base64Data, "base64");
      const fileName = `${Date.now()}-${input.file.name}`;
      const filePath = `${ctx.user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await ctx.supabase.storage
        .from("todo-images")
        .upload(filePath, buffer, {
          contentType: input.file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = ctx.supabase.storage.from("todo-images").getPublicUrl(filePath);

      // Update todo with image URL
      const { data, error } = await ctx.supabase
        .from("todos")
        .update({ image_url: publicUrl })
        .eq("id", input.todoId)
        .eq("user_id", ctx.user.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    }),

  // Remove image from a todo
  removeImage: protectedProcedure
    .input(z.object({ todoId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get the current todo
      const { data: todo } = await ctx.supabase
        .from("todos")
        .select("image_url")
        .eq("id", input.todoId)
        .eq("user_id", ctx.user.id)
        .single();

      if (todo?.image_url) {
        const fileName = todo.image_url.split("/").pop();
        if (fileName) {
          await ctx.supabase.storage
            .from("todo-images")
            .remove([`${ctx.user.id}/${fileName}`]);
        }
      }

      // Update todo to remove image URL
      const { data, error } = await ctx.supabase
        .from("todos")
        .update({ image_url: null })
        .eq("id", input.todoId)
        .eq("user_id", ctx.user.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    }),
});
