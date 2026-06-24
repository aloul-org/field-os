import { NotificationBell } from "@/components/shared/NotificationBell";
import { UserMenu } from "@/components/layout/UserMenu";
import type { TeamRole } from "@/lib/types/database";

export function TopBar({
  companyName,
  userName,
  userEmail,
  role,
  avatarUrl,
  unread = 0,
}: {
  companyName: string;
  userName: string;
  userEmail: string;
  role: TeamRole;
  avatarUrl: string | null;
  unread?: number;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:px-6">
      <div className="flex items-center gap-2 lg:hidden">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
          F
        </span>
        <span className="text-sm font-semibold">FieldOS</span>
      </div>
      <p className="hidden truncate text-sm font-medium text-muted-foreground lg:block">
        {companyName}
      </p>
      <div className="flex items-center gap-1">
        <NotificationBell unread={unread} />
        <UserMenu
          name={userName}
          email={userEmail}
          role={role}
          avatarUrl={avatarUrl}
        />
      </div>
    </header>
  );
}
