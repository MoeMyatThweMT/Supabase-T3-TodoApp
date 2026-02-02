"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export function CalendarView() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const { data: todos = [] } = api.todo.getAll.useQuery();

  // Get todos for selected date
  const todosForSelectedDate = todos.filter((todo) => {
    if (!todo.due_date) return false;
    const todoDate = new Date(todo.due_date);
    return (
      todoDate.getDate() === selectedDate.getDate() &&
      todoDate.getMonth() === selectedDate.getMonth() &&
      todoDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  // Calendar helpers
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  ).getDay();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
    );
  };

  const getTodosForDate = (day: number) => {
    return todos.filter((todo) => {
      if (!todo.due_date) return false;
      const todoDate = new Date(todo.due_date);
      return (
        todoDate.getDate() === day &&
        todoDate.getMonth() === currentMonth.getMonth() &&
        todoDate.getFullYear() === currentMonth.getFullYear()
      );
    });
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white">Calendar</h1>
        <p className="mt-2 text-gray-400">View and manage your tasks by date</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="rounded-lg bg-white p-6 shadow-lg">
            {/* Month Navigation */}
            <div className="mb-6 flex items-center justify-between">
              <button
                onClick={previousMonth}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <h2 className="text-xl font-bold text-gray-900">
                {monthNames[currentMonth.getMonth()]}{" "}
                {currentMonth.getFullYear()}
              </h2>
              <button
                onClick={nextMonth}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-sm font-semibold text-gray-600"
                >
                  {day}
                </div>
              ))}

              {/* Empty cells for days before month starts */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const todosOnDay = getTodosForDate(day);
                const isSelected =
                  day === selectedDate.getDate() &&
                  currentMonth.getMonth() === selectedDate.getMonth() &&
                  currentMonth.getFullYear() === selectedDate.getFullYear();
                const isToday =
                  day === new Date().getDate() &&
                  currentMonth.getMonth() === new Date().getMonth() &&
                  currentMonth.getFullYear() === new Date().getFullYear();

                return (
                  <button
                    key={day}
                    onClick={() =>
                      setSelectedDate(
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth(),
                          day,
                        ),
                      )
                    }
                    className={`aspect-square rounded-lg p-2 text-sm transition-colors ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : isToday
                          ? "bg-blue-100 font-bold text-blue-900"
                          : "hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex h-full flex-col items-center justify-center">
                      <span>{day}</span>
                      {todosOnDay.length > 0 && (
                        <span
                          className={`mt-1 text-xs ${isSelected ? "text-white" : "text-blue-600"}`}
                        >
                          {todosOnDay.length} task
                          {todosOnDay.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tasks for selected date */}
        <div className="lg:col-span-1">
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Tasks for {selectedDate.toLocaleDateString()}
            </h3>

            {todosForSelectedDate.length === 0 ? (
              <p className="text-sm text-gray-500">
                No tasks scheduled for this date
              </p>
            ) : (
              <div className="space-y-3">
                {todosForSelectedDate.map((todo) => (
                  <div
                    key={todo.id}
                    className="rounded-lg border border-gray-200 p-3 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        readOnly
                        className="mt-0.5 h-4 w-4 rounded border-gray-300"
                      />
                      <div className="flex-1">
                        <h4
                          className={`font-medium ${
                            todo.completed
                              ? "text-gray-400 line-through"
                              : "text-gray-900"
                          }`}
                        >
                          {todo.title}
                        </h4>
                        {todo.description && (
                          <p className="mt-1 text-sm text-gray-500">
                            {todo.description}
                          </p>
                        )}
                        {todo.subtasks && todo.subtasks.length > 0 && (
                          <div className="mt-2 text-xs text-gray-400">
                            {
                              todo.subtasks.filter(
                                (st: { completed: boolean }) => st.completed,
                              ).length
                            }
                            /{todo.subtasks.length} subtasks completed
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
