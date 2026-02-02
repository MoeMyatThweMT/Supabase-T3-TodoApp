"use client";

import { api } from "~/trpc/react";

export function StatsView() {
  const { data: todos = [] } = api.todo.getAll.useQuery();

  // Calculate stats
  const totalTodos = todos.length;
  const completedTodos = todos.filter((t) => t.completed).length;
  const pendingTodos = totalTodos - completedTodos;
  const completionRate =
    totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  // Calculate streak (consecutive days with completed tasks)
  const calculateStreak = () => {
    const completedDates = todos
      .filter((t) => t.completed)
      .map((t) => new Date(t.updated_at).toDateString())
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (completedDates.length === 0) return 0;

    // Check if streak is current (today or yesterday)
    if (completedDates[0] !== today && completedDates[0] !== yesterday) {
      return 0;
    }

    let currentDate = new Date();
    for (let i = 0; i < completedDates.length; i++) {
      const checkDate = new Date(currentDate);
      checkDate.setHours(0, 0, 0, 0);

      const completedStr = completedDates[i];
      if (!completedStr) continue; // skip if missing/undefined

      const completedDate = new Date(completedStr);
      completedDate.setHours(0, 0, 0, 0);

      if (checkDate.getTime() === completedDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const currentStreak = calculateStreak();

  // Tasks by status
  const overdueTodos = todos.filter((t) => {
    if (!t.due_date || t.completed) return false;
    return new Date(t.due_date) < new Date();
  }).length;

  const todayTodos = todos.filter((t) => {
    if (!t.due_date) return false;
    const today = new Date().toDateString();
    const dueDate = new Date(t.due_date).toDateString();
    return dueDate === today;
  }).length;

  // Activity by day of week
  const activityByDay = [0, 0, 0, 0, 0, 0, 0];
  todos.forEach((todo) => {
    const day = new Date(todo.created_at).getDay();
    activityByDay[day]++;
  });

  const maxActivity = Math.max(...activityByDay, 1);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white">Statistics</h1>
        <p className="mt-2 text-gray-400">
          Track your productivity and progress
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Tasks */}
        <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-100">Total Tasks</p>
              <p className="mt-2 text-3xl font-bold text-white">{totalTodos}</p>
            </div>
            <div className="bg-opacity-30 rounded-full bg-blue-400 p-3">
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="rounded-lg bg-gradient-to-br from-green-500 to-green-600 p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-100">Completed</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {completedTodos}
              </p>
            </div>
            <div className="bg-opacity-30 rounded-full bg-green-400 p-3">
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Pending */}
        <div className="rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-100">Pending</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {pendingTodos}
              </p>
            </div>
            <div className="bg-opacity-30 rounded-full bg-yellow-400 p-3">
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Streak */}
        <div className="rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-100">
                Current Streak
              </p>
              <p className="mt-2 text-3xl font-bold text-white">
                {currentStreak} days
              </p>
            </div>
            <div className="bg-opacity-30 rounded-full bg-purple-400 p-3">
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Completion Rate */}
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Completion Rate
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-4 w-full rounded-full bg-gray-200">
                <div
                  className="h-4 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {completionRate}%
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Due Today</p>
              <p className="text-xl font-semibold text-gray-900">
                {todayTodos}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-xl font-semibold text-red-600">
                {overdueTodos}
              </p>
            </div>
          </div>
        </div>

        {/* Activity Chart */}
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Activity by Day
          </h3>
          <div className="flex h-48 items-end justify-between gap-2">
            {activityByDay.map((count, index) => {
              const height = (count / maxActivity) * 100;
              return (
                <div
                  key={days[index]}
                  className="flex flex-1 flex-col items-center"
                >
                  <div
                    className="mb-2 flex w-full items-end justify-center"
                    style={{ height: "160px" }}
                  >
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-blue-500 to-blue-300 transition-all hover:from-blue-600 hover:to-blue-400"
                      style={{
                        height: `${height}%`,
                        minHeight: count > 0 ? "8px" : "0",
                      }}
                      title={`${count} tasks`}
                    />
                  </div>
                  <p className="text-xs font-medium text-gray-600">
                    {days[index]}
                  </p>
                  <p className="text-xs text-gray-400">{count}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Motivational Message */}
      {currentStreak > 0 && (
        <div className="mt-6 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🔥</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white">
                {currentStreak === 1
                  ? "Great start! Keep it going!"
                  : currentStreak < 7
                    ? `${currentStreak} days streak! You're building momentum!`
                    : currentStreak < 30
                      ? `${currentStreak} days streak! You're on fire!`
                      : `Amazing! ${currentStreak} days streak! You're unstoppable!`}
              </h3>
              <p className="mt-1 text-purple-100">
                Complete a task today to maintain your streak!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
