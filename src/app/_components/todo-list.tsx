"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "~/trpc/react";
import { createClient } from "~/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  due_date: string | null;
  image_url: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  subtasks?: Array<{
    id: string;
    title: string;
    completed: boolean;
    created_at: string;
  }>;
}

export function TodoList() {
  const supabase = createClient();
  const utils = api.useUtils();

  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoDescription, setNewTodoDescription] = useState("");
  const [newTodoDueDate, setNewTodoDueDate] = useState("");
  const [newSubtasks, setNewSubtasks] = useState<string[]>([]);
  const [subtaskInput, setSubtaskInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const { data: todos = [], isLoading } = api.todo.getAll.useQuery();
  const createTodo = api.todo.create.useMutation({
    onSuccess: () => {
      void utils.todo.getAll.invalidate();
      setNewTodoTitle("");
      setNewTodoDescription("");
      setNewTodoDueDate("");
      setNewSubtasks([]);
      setSubtaskInput("");
    },
  });

  const updateTodo = api.todo.update.useMutation({
    onSuccess: () => {
      void utils.todo.getAll.invalidate();
      setEditingId(null);
    },
  });

  const deleteTodo = api.todo.delete.useMutation({
    onSuccess: () => {
      void utils.todo.getAll.invalidate();
    },
  });

  const uploadImage = api.todo.uploadImage.useMutation({
    onSuccess: () => {
      void utils.todo.getAll.invalidate();
      setUploadingId(null);
    },
  });

  const removeImage = api.todo.removeImage.useMutation({
    onSuccess: () => {
      void utils.todo.getAll.invalidate();
    },
  });

  // Set up realtime subscription
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Subscribe to changes in the todos table
      channelRef.current = supabase
        .channel("todos-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "todos",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log("Realtime update:", payload);
            // Invalidate and refetch todos when any change occurs
            void utils.todo.getAll.invalidate();
          },
        )
        .subscribe();
    };

    void setupRealtimeSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
      }
    };
  }, [supabase, utils]);

  const handleCreateTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    createTodo.mutate({
      title: newTodoTitle,
      description: newTodoDescription || undefined,
      due_date: newTodoDueDate || undefined,
      subtasks: newSubtasks.length > 0 ? newSubtasks : undefined,
    });
  };

  const handleAddSubtask = () => {
    if (subtaskInput.trim()) {
      setNewSubtasks([...newSubtasks, subtaskInput.trim()]);
      setSubtaskInput("");
    }
  };

  const handleRemoveSubtask = (index: number) => {
    setNewSubtasks(newSubtasks.filter((_, i) => i !== index));
  };

  const handleToggleComplete = (todo: Todo) => {
    updateTodo.mutate({
      id: todo.id,
      completed: !todo.completed,
    });
  };

  const handleStartEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditDescription(todo.description ?? "");
  };

  const handleSaveEdit = (todoId: string) => {
    updateTodo.mutate({
      id: todoId,
      title: editTitle,
      description: editDescription || undefined,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
  };

  const handleDelete = (todoId: string) => {
    if (confirm("Are you sure you want to delete this todo?")) {
      deleteTodo.mutate({ id: todoId });
    }
  };

  const handleFileSelect = async (
    todoId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setUploadingId(todoId);

    // Convert file to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      uploadImage.mutate({
        todoId,
        file: {
          name: file.name,
          type: file.type,
          base64,
        },
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (todoId: string) => {
    if (confirm("Are you sure you want to remove this image?")) {
      removeImage.mutate({ todoId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl text-white">Loading todos...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white">My Todos</h1>
        <p className="mt-2 text-gray-400">
          Manage your tasks and stay organized
        </p>
      </div>

      {/* Create Todo Form */}
      <form
        onSubmit={handleCreateTodo}
        className="mb-8 rounded-lg bg-white p-6 shadow-lg"
      >
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Create New Todo
        </h2>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
              placeholder="What needs to be done?"
              required
            />
          </div>
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="description"
              value={newTodoDescription}
              onChange={(e) => setNewTodoDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
              placeholder="Add more details..."
              rows={3}
            />
          </div>
          <div>
            <label
              htmlFor="dueDate"
              className="block text-sm font-medium text-gray-700"
            >
              Due Date
            </label>
            <input
              id="dueDate"
              type="date"
              value={newTodoDueDate}
              onChange={(e) => setNewTodoDueDate(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Subtasks
            </label>
            <div className="mb-2 flex gap-2">
              <input
                type="text"
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                placeholder="Add a subtask..."
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
              >
                Add
              </button>
            </div>
            {newSubtasks.length > 0 && (
              <div className="space-y-1">
                {newSubtasks.map((subtask, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded bg-gray-50 px-3 py-2"
                  >
                    <span className="flex-1 text-sm text-gray-700">
                      • {subtask}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={createTodo.isPending}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
          >
            {createTodo.isPending ? "Creating..." : "Create Todo"}
          </button>
        </div>
      </form>

      {/* Todos List */}
      <div className="space-y-4">
        {todos.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow-lg">
            <p className="text-gray-500">No todos yet. Create one above!</p>
          </div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className="rounded-lg bg-white p-6 shadow-lg transition-all hover:shadow-xl"
            >
              {editingId === todo.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(todo.id)}
                      disabled={updateTodo.isPending}
                      className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggleComplete(todo)}
                      className="mt-1 h-5 w-5 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <h3
                        className={`text-xl font-semibold ${
                          todo.completed
                            ? "text-gray-400 line-through"
                            : "text-gray-900"
                        }`}
                      >
                        {todo.title}
                      </h3>
                      {todo.description && (
                        <p className="mt-1 text-gray-600">{todo.description}</p>
                      )}
                      {todo.due_date && (
                        <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-1 text-sm text-blue-800">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          Due: {new Date(todo.due_date).toLocaleDateString()}
                        </div>
                      )}
                      {todo.subtasks && todo.subtasks.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <p className="text-sm font-medium text-gray-700">
                            Subtasks:
                          </p>
                          {todo.subtasks.map((subtask) => (
                            <div
                              key={subtask.id}
                              className="flex items-center gap-2 text-sm text-gray-600"
                            >
                              <span
                                className={
                                  subtask.completed ? "line-through" : ""
                                }
                              >
                                • {subtask.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {todo.image_url && (
                        <div className="relative mt-4 inline-block">
                          <img
                            src={todo.image_url}
                            alt="Todo attachment"
                            className="max-w-sm rounded-lg shadow-md"
                          />
                          <button
                            onClick={() => handleRemoveImage(todo.id)}
                            disabled={removeImage.isPending}
                            className="absolute top-2 right-2 rounded-full bg-red-600 p-2 text-white hover:bg-red-700 disabled:opacity-50"
                            title="Remove image"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                      <p className="mt-2 text-xs text-gray-400">
                        Created:{" "}
                        {new Date(todo.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleStartEdit(todo)}
                      className="rounded-md bg-yellow-600 px-3 py-1 text-sm text-white hover:bg-yellow-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(todo.id)}
                      disabled={deleteTodo.isPending}
                      className="rounded-md bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Delete
                    </button>
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(todo.id, e)}
                        className="hidden"
                        id={`file-${todo.id}`}
                      />
                      <button
                        onClick={() =>
                          document.getElementById(`file-${todo.id}`)?.click()
                        }
                        disabled={uploadingId === todo.id}
                        className="rounded-md bg-purple-600 px-3 py-1 text-sm text-white hover:bg-purple-700 disabled:opacity-50"
                      >
                        {uploadingId === todo.id
                          ? "Uploading..."
                          : todo.image_url
                            ? "Change Image"
                            : "Add Image"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Realtime indicator */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-400">
          <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
          Realtime updates enabled
        </p>
      </div>
    </div>
  );
}
