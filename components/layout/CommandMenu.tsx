"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Search,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Plus,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useCommandMenu } from "@/lib/stores/commandMenu";
import type { NavItem } from "@/components/layout/nav-items";
import { NAV_ICON_MAP } from "@/components/layout/nav-icon-map";

type Command = {
  id: string;
  label: string;
  href: string;
  group: string;
  icon: keyof typeof NAV_ICON_MAP | "Plus" | "Sparkles";
  keywords?: string;
};

/** Quick-create actions, each gated on the section being available to this role. */
const QUICK_ACTIONS: {
  id: string;
  label: string;
  href: string;
  requires: string;
  icon: "Plus" | "Sparkles";
  keywords: string;
}[] = [
  { id: "new-estimate", label: "New estimate", href: "/estimates/new", requires: "/estimates", icon: "Plus", keywords: "quote price create" },
  { id: "new-lead", label: "New lead", href: "/leads", requires: "/leads", icon: "Plus", keywords: "enquiry customer create" },
  { id: "new-invoice", label: "New invoice", href: "/invoices", requires: "/invoices", icon: "Plus", keywords: "bill payment create" },
  { id: "ask-coach", label: "Ask the AI Coach", href: "/coach", requires: "/coach", icon: "Sparkles", keywords: "ai assistant help question" },
];

function ActionIcon({ name }: { name: Command["icon"] }) {
  if (name === "Plus") return <Plus className="h-4 w-4" aria-hidden="true" />;
  if (name === "Sparkles") return <Sparkles className="h-4 w-4" aria-hidden="true" />;
  const Icon = NAV_ICON_MAP[name];
  return <Icon className="h-4 w-4" aria-hidden="true" />;
}

export function CommandMenu({ items }: { items: NavItem[] }) {
  const { open, setOpen, toggle } = useCommandMenu();
  const router = useRouter();
  const t = useTranslations("nav");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Global ⌘K / Ctrl+K to open from anywhere.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  // Reset query + selection each time the palette opens; focus the input.
  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      // Defer so the element exists after the portal mounts.
      const id = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  const available = useMemo(
    () => new Set(items.map((i) => i.href)),
    [items]
  );

  const commands: Command[] = useMemo(() => {
    const nav: Command[] = items.map((i) => ({
      id: `nav-${i.href}`,
      label: t(i.key),
      href: i.href,
      group: "Go to",
      icon: i.icon,
    }));
    const actions: Command[] = QUICK_ACTIONS.filter((a) =>
      available.has(a.requires)
    ).map((a) => ({
      id: a.id,
      label: a.label,
      href: a.href,
      group: "Quick actions",
      icon: a.icon,
      keywords: a.keywords,
    }));
    return [...actions, ...nav];
  }, [items, available, t]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) =>
      `${c.label} ${c.keywords ?? ""}`.toLowerCase().includes(q)
    );
  }, [commands, query]);

  // Keep the active index in range as the list shrinks.
  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  function run(cmd: Command | undefined) {
    if (!cmd) return;
    setOpen(false);
    router.push(cmd.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % Math.max(1, filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(filtered[active]);
    }
  }

  // Scroll the active row into view as you arrow through.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${active}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  // Render groups in order, but keep a single flat index for keyboard nav.
  const groups = useMemo(() => {
    const order = ["Quick actions", "Go to"];
    const map = new Map<string, { cmd: Command; index: number }[]>();
    filtered.forEach((cmd, index) => {
      const arr = map.get(cmd.group) ?? [];
      arr.push({ cmd, index });
      map.set(cmd.group, arr);
    });
    return order
      .filter((g) => map.has(g))
      .map((g) => ({ name: g, rows: map.get(g)! }));
  }, [filtered]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm animate-overlay-in" />
        <Dialog.Content
          onKeyDown={onKeyDown}
          className="fixed left-1/2 top-[14vh] z-50 w-[92vw] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-card-hover animate-command-in focus:outline-none"
        >
          <Dialog.Title className="sr-only">Command menu</Dialog.Title>
          <Dialog.Description className="sr-only">
            Search to jump to a page or start a quick action.
          </Dialog.Description>

          <div className="flex items-center gap-3 border-b px-4">
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search or jump to…"
              className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
              aria-label="Search commands"
            />
          </div>

          <div
            ref={listRef}
            className="max-h-[52vh] overflow-y-auto scrollbar-slim p-2"
          >
            {filtered.length === 0 ? (
              <p className="px-3 py-10 text-center text-sm text-muted-foreground">
                Nothing matches “{query}”.
              </p>
            ) : (
              groups.map((group) => (
                <div key={group.name} className="mb-1">
                  <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {group.name}
                  </p>
                  {group.rows.map(({ cmd, index }) => {
                    const isActive = index === active;
                    return (
                      <button
                        key={cmd.id}
                        type="button"
                        data-index={index}
                        onMouseEnter={() => setActive(index)}
                        onClick={() => run(cmd)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                          isActive
                            ? "bg-primary/10 text-foreground"
                            : "text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <span
                          className={cn(
                            "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <ActionIcon name={cmd.icon} />
                        </span>
                        <span className="flex-1 truncate font-medium text-foreground">
                          {cmd.label}
                        </span>
                        {isActive && (
                          <CornerDownLeft
                            className="h-4 w-4 text-muted-foreground"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t px-4 py-2.5 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <kbd className="inline-flex items-center gap-1 rounded border bg-muted px-1.5 py-0.5">
                <ArrowUp className="h-3 w-3" />
                <ArrowDown className="h-3 w-3" />
              </kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="inline-flex items-center gap-1 rounded border bg-muted px-1.5 py-0.5">
                <CornerDownLeft className="h-3 w-3" />
              </kbd>
              to open
              <span className="mx-1">·</span>
              <kbd className="rounded border bg-muted px-1.5 py-0.5">esc</kbd>
              to close
            </span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
