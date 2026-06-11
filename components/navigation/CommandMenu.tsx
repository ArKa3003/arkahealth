"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  commandRoutes,
  filterCommandRoutes,
  type CommandRoute,
} from "@/lib/navigation/routes";

/**
 * Global ⌘K / Ctrl+K command palette for quick route navigation.
 */
export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  const results = React.useMemo(
    () => filterCommandRoutes(query, commandRoutes),
    [query],
  );

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setQuery("");
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const navigate = React.useCallback(
    (item: CommandRoute) => {
      setOpen(false);
      if (item.external) {
        window.open(item.href, "_blank", "noopener,noreferrer");
        return;
      }
      if (item.href.startsWith("/#")) {
        const hash = item.href.slice(1);
        if (window.location.pathname === "/") {
          document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
        } else {
          router.push(item.href);
        }
        return;
      }
      router.push(item.href);
    },
    [router],
  );

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      navigate(results[activeIndex]);
    }
  };

  React.useEffect(() => {
    const activeEl = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, results.length]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, CommandRoute[]>();
    for (const item of results) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return map;
  }, [results]);

  let runningIndex = -1;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border-subtle px-4 py-3 text-left">
          <DialogTitle className="sr-only">Command menu</DialogTitle>
          <DialogDescription className="sr-only">
            Search routes, demos, evidence pages, and documentation
          </DialogDescription>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 shrink-0 text-arka-slate-400" aria-hidden />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onInputKeyDown}
              placeholder="Search pages, demos, docs…"
              className="flex-1 bg-transparent text-sm text-arka-slate-900 outline-none placeholder:text-arka-slate-400"
              aria-label="Search navigation"
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="hidden rounded border border-border-subtle bg-surface-sunken px-1.5 py-0.5 text-[10px] font-medium text-arka-slate-500 sm:inline">
              ESC
            </kbd>
          </div>
        </DialogHeader>

        <div className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-arka-slate-500">No results found.</p>
          ) : (
            <ul ref={listRef} role="listbox" aria-label="Search results">
              {[...grouped.entries()].map(([group, items]) => (
                <li key={group} className="mb-2">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-arka-slate-400">
                    {group}
                  </p>
                  <ul>
                    {items.map((item) => {
                      runningIndex += 1;
                      const index = runningIndex;
                      const isActive = index === activeIndex;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            data-index={index}
                            role="option"
                            aria-selected={isActive}
                            className={cn(
                              "flex w-full flex-col rounded-radius-md px-3 py-2 text-left transition-colors",
                              isActive ? "bg-surface-sunken" : "hover:bg-surface-sunken/70",
                            )}
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => navigate(item)}
                          >
                            <span className="text-sm font-medium text-arka-slate-900">
                              {item.title}
                              {item.external ? (
                                <span className="ml-1 text-xs text-arka-slate-400">↗</span>
                              ) : null}
                            </span>
                            {item.description ? (
                              <span className="text-xs text-arka-slate-500">{item.description}</span>
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border-subtle px-4 py-2 text-[11px] text-arka-slate-400">
          <span className="hidden sm:inline">
            Navigate with ↑↓ · Enter to open ·{" "}
          </span>
          <kbd className="rounded border border-border-subtle bg-surface-sunken px-1 py-0.5 text-[10px]">
            ⌘K
          </kbd>
        </div>
      </DialogContent>
    </Dialog>
  );
}
