import { NotificationBell } from "@/components/shared/NotificationBell";
import { UserMenu } from "@/components/layout/UserMenu";
import { CommandTrigger } from "@/components/layout/CommandTrigger";
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
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 lg:px-6">
      <div className="flex items-center gap-2 lg:hidden">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-primary to-primary/80 font-display text-sm font-bold text-primary-foreground">
          F
        </span>
      </div>
      <CommandTrigger />
      <p className="hidden flex-1 truncate text-right text-sm font-medium text-muted-foreground lg:block">
        {companyName}
      </p>
      <div className="ml-auto flex items-center gap-1 lg:ml-0">
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
