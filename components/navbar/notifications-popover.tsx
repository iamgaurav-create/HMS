"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Bell, AlertTriangle, CheckCircle, Clock, Calendar, HeartPulse } from "lucide-react";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/actions/notification-actions";

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: Date;
};

function relativeTime(date: Date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

function getIcon(type: string) {
  switch (type) {
    case "appointment":
      return <Calendar className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />;
    case "urgent":
      return <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />;
    case "warning":
      return <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />;
    default:
      return <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />;
  }
}

export function NotificationsPopover() {
  let authUserId: string | null | undefined = null;
  try {
    const auth = useAuth();
    authUserId = auth.userId;
  } catch {
    // SSR safe fallback if outside ClerkProvider
  }

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!authUserId) return;
    setLoading(true);
    try {
      const data = await getNotifications(authUserId);
      setNotifications(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [authUserId]);

  useEffect(() => {
    fetchNotifications();

    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function handleClearAll() {
    if (!authUserId) return;
    await markAllNotificationsAsRead(authUserId);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );
  }

  async function handleMarkRead(id: number) {
    await markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 text-slate-700 shadow-xs backdrop-blur-md transition-all hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800"
        title="Notifications"
      >
        <Bell className="h-4 w-4 text-slate-600 dark:text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 md:w-96 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in-50 duration-150">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-rose-500" />
                Notifications
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-[11px] text-sky-600 hover:underline dark:text-sky-400 font-semibold"
                >
                  Mark All Read
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Loading notifications...
                </div>
              ) : notifications.length > 0 ? (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      if (!n.isRead) handleMarkRead(n.id);
                      if (n.link) {
                        window.location.href = n.link;
                        setIsOpen(false);
                      }
                    }}
                    className={`flex w-full items-start gap-3 rounded-xl p-2.5 text-left border transition ${
                      n.isRead
                        ? "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800/60 opacity-70"
                        : "bg-sky-50/50 dark:bg-sky-950/20 border-sky-100 dark:border-sky-900/40 hover:bg-sky-50 dark:hover:bg-sky-950/30"
                    }`}
                  >
                    {getIcon(n.type)}
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {n.title}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                        {n.message}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-400 mt-1">
                        {relativeTime(n.createdAt)}
                      </span>
                    </div>
                    {!n.isRead && (
                      <span className="ml-auto mt-1 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                    )}
                  </button>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  No new notifications
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
