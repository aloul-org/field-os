"use client";

import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * In-app notification bell. Phase 1 renders the unread count passed from the
 * server; live updates (Supabase Realtime) and the dropdown list are wired in
 * the notifications phase.
 */
export function NotificationBell({ unread = 0 }: { unread?: number }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
    >
      <Bell className="h-5 w-5" />
      {unread > 0 && (
        <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Button>
  );
}
