"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ClinComboboxOption {
  value: string;
  label?: string;
}

export interface ClinComboboxProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ClinComboboxOption[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  allowCustom?: boolean;
  className?: string;
}

/**
 * Keyboard-first combobox with inline validation for order composer fields.
 */
export function ClinCombobox({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Select or type…",
  required = false,
  error,
  allowCustom = true,
  className,
}: ClinComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.value.toLowerCase().includes(q) ||
        (o.label?.toLowerCase().includes(q) ?? false),
    );
  }, [options, query]);

  React.useEffect(() => {
    const t = window.setTimeout(() => setActiveIndex(0), 0);
    return () => window.clearTimeout(t);
  }, [query, open]);

  React.useEffect(() => {
    if (open && listRef.current) {
      const item = listRef.current.querySelector<HTMLElement>(
        `[data-index="${activeIndex}"]`,
      );
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, open]);

  const selectOption = (next: string) => {
    onChange(next);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (open && filtered[activeIndex]) {
        selectOption(filtered[activeIndex].value);
        return;
      }
      if (allowCustom && query.trim()) {
        selectOption(query.trim());
      }
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "Tab") {
      setOpen(false);
    }
  };

  const displayValue = value || query;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-arka-slate-800">
        {label}
        {required ? <span className="text-danger ml-0.5">*</span> : null}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative">
            <input
              ref={inputRef}
              id={id}
              type="text"
              role="combobox"
              aria-expanded={open}
              aria-controls={`${id}-listbox`}
              aria-autocomplete="list"
              aria-invalid={!!error}
              aria-describedby={error ? `${id}-error` : undefined}
              value={open ? query : displayValue}
              onChange={(e) => {
                setQuery(e.target.value);
                if (allowCustom) onChange(e.target.value);
                if (!open) setOpen(true);
              }}
              onFocus={() => {
                setQuery(value);
                setOpen(true);
              }}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              className={cn(
                "flex h-12 w-full rounded-radius-md border bg-surface px-4 pr-10 text-body-lg",
                "shadow-elevation-1 transition-[border-color,box-shadow] duration-200",
                "placeholder:text-arka-slate-400",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2",
                error
                  ? "border-danger focus-visible:ring-danger"
                  : "border-border-subtle hover:border-border-strong",
              )}
            />
            <ChevronsUpDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-arka-slate-400"
              aria-hidden
            />
          </div>
        </PopoverAnchor>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <ul
            ref={listRef}
            id={`${id}-listbox`}
            role="listbox"
            className="max-h-56 overflow-y-auto py-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-caption text-arka-slate-500">
                {allowCustom ? "Press Enter to use custom value" : "No matches"}
              </li>
            ) : (
              filtered.map((option, index) => (
                <li
                  key={option.value}
                  role="option"
                  data-index={index}
                  aria-selected={value === option.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm",
                    index === activeIndex ? "bg-arka-teal-50 text-arka-slate-900" : "text-arka-slate-700",
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectOption(option.value)}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0 text-arka-teal-600",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                    aria-hidden
                  />
                  <span>{option.label ?? option.value}</span>
                </li>
              ))
            )}
          </ul>
        </PopoverContent>
      </Popover>
      {error ? (
        <p id={`${id}-error`} className="text-caption text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
