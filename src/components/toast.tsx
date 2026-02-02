"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
  onClose?: () => void;
  id?: string;
}

export function Toast({
  message,
  type,
  duration = 4000,
  onClose,
  id,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    console.log(
      "Toast rendered with message:",
      message,
      "type:",
      type,
      "id:",
      id,
    );
    const timer = setTimeout(() => {
      console.log("Toast timeout triggered for id:", id);
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose, id, message, type]);

  if (!isVisible) {
    console.log("Toast is not visible, returning null for id:", id);
    return null;
  }

  const bgColor = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  }[type];

  const icon = {
    success: (
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
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
    error: (
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
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ),
    info: (
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
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  }[type];

  return (
    <div className="animate-in slide-in-from-top-2 fade-in">
      <div
        className={`${bgColor} flex min-w-max items-center gap-3 rounded-lg px-6 py-4 text-white shadow-lg`}
      >
        {icon}
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([]);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info",
    duration = 4000,
  ) => {
    const id = Date.now().toString();
    console.log("showToast called with:", { message, type, duration, id });
    setToasts((prev) => {
      const newToasts = [...prev, { message, type, duration, id }];
      console.log("setToasts - new toasts array:", newToasts);
      return newToasts;
    });
  };

  const hideToast = (id: string) => {
    console.log("hideToast called with id:", id);
    setToasts((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      console.log("setToasts - filtered toasts array:", filtered);
      return filtered;
    });
  };

  const removeToast = (id: string) => {
    console.log("removeToast called with id:", id);
    hideToast(id);
  };

  return {
    toasts,
    showToast,
    hideToast,
    removeToast,
  };
}
