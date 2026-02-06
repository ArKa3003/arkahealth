"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Zap,
  Scan,
  Activity,
  Radio,
  Atom,
  LayoutGrid,
  DollarSign,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { ImagingOptionCard, ImagingOptionCardSkeleton } from "./ImagingOptionCard";
import { RadiationBadge } from "./RadiationBadge";
import { clsx } from "clsx";
import type { ImagingOption, Modality } from "@/lib/demos/ed/types";

export type CaseMode = "learning" | "quiz";

export interface OrderingInterfaceProps {
  imagingOptions: ImagingOption[];
  selectedImaging: string[];
  onSelectionChange: (ids: string[]) => void;
  onSubmit: () => void;
  mode: CaseMode;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

const MODALITY_TABS: {
  value: Modality | "all" | "none";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "all", label: "All", icon: LayoutGrid },
  { value: "xray", label: "X-ray", icon: Zap },
  { value: "ct", label: "CT", icon: Scan },
  { value: "mri", label: "MRI", icon: Activity },
  { value: "ultrasound", label: "US", icon: Radio },
  { value: "nuclear", label: "Nuclear", icon: Atom },
];

export function OrderingInterface({
  imagingOptions,
  selectedImaging,
  onSelectionChange,
  onSubmit,
  mode,
  disabled = false,
  isLoading = false,
  className,
}: OrderingInterfaceProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeModality, setActiveModality] = React.useState<Modality | "all" | "none">("all");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredOptions = React.useMemo(() => {
    let options = imagingOptions;
    if (activeModality !== "all" && activeModality !== "none") {
      options = options.filter((opt) => opt.modality === activeModality);
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      options = options.filter(
        (opt) =>
          opt.name.toLowerCase().includes(q) ||
          opt.short_name.toLowerCase().includes(q) ||
          (opt.modality as string).toLowerCase().includes(q)
      );
    }
    return options;
  }, [imagingOptions, activeModality, debouncedSearch]);

  const selectionTotals = React.useMemo(() => {
    if (selectedImaging.includes("no-imaging")) {
      return { count: 1, cost: 0, radiation: 0, isNoImaging: true };
    }
    const selected = imagingOptions.filter((opt) => selectedImaging.includes(opt.id));
    return {
      count: selected.length,
      cost: selected.reduce((sum, opt) => sum + opt.typical_cost_usd, 0),
      radiation: selected.reduce((sum, opt) => sum + opt.radiation_msv, 0),
      isNoImaging: false,
    };
  }, [selectedImaging, imagingOptions]);

  const handleSelect = (optionId: string) => {
    if (disabled) return;
    if (optionId === "no-imaging") {
      if (selectedImaging.includes("no-imaging")) {
        onSelectionChange([]);
      } else {
        onSelectionChange(["no-imaging"]);
      }
    } else {
      let newSelection = selectedImaging.filter((id) => id !== "no-imaging");
      if (newSelection.includes(optionId)) {
        newSelection = newSelection.filter((id) => id !== optionId);
      } else {
        newSelection = [...newSelection, optionId];
      }
      onSelectionChange(newSelection);
    }
  };

  const clearSelection = () => {
    if (!disabled) onSelectionChange([]);
  };

  return (
    <div className={clsx("flex flex-col h-full", className)}>
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">Order Imaging</h3>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            type="text"
            placeholder="Search imaging studies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 placeholder:text-slate-500"
            disabled={disabled}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" aria-hidden />
            </button>
          )}
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {MODALITY_TABS.map((tab) => {
            const isActive = activeModality === tab.value;
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveModality(tab.value)}
                disabled={disabled}
                className={clsx(
                  "flex min-h-[44px] items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors touch-manipulation",
                  isActive
                    ? "bg-teal-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading ? (
          [...Array(5)].map((_, i) => <ImagingOptionCardSkeleton key={i} />)
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredOptions.map((option, index) => (
              <ImagingOptionCard
                key={option.id}
                id={option.id}
                name={option.name}
                shortName={option.short_name}
                modality={option.modality}
                costUsd={option.typical_cost_usd}
                radiationMsv={option.radiation_msv}
                description={option.description}
                isSelected={selectedImaging.includes(option.id)}
                onSelect={() => handleSelect(option.id)}
                disabled={disabled}
                index={index}
              />
            ))}
            {filteredOptions.length === 0 && debouncedSearch && (
              <div className="text-center py-8 text-slate-600">
                <Search className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p>No imaging studies match your search</p>
              </div>
            )}
          </AnimatePresence>
        )}

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-sm text-slate-500">or</span>
          </div>
        </div>

        <ImagingOptionCard
          id="no-imaging"
          name="No Imaging Indicated"
          shortName="No Imaging"
          modality="none"
          costUsd={0}
          radiationMsv={0}
          isSelected={selectedImaging.includes("no-imaging")}
          onSelect={() => handleSelect("no-imaging")}
          disabled={disabled}
          variant="special"
        />
      </div>

      <div className="border-t border-slate-200 p-4 bg-slate-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {selectionTotals.count > 0 ? (
              <>
                <Badge variant="success">
                  {selectionTotals.isNoImaging
                    ? "No Imaging"
                    : `${selectionTotals.count} selected`}
                </Badge>
                {!selectionTotals.isNoImaging && (
                  <>
                    <span className="text-sm text-slate-700 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      ${selectionTotals.cost.toLocaleString()}
                    </span>
                    <RadiationBadge doseMsv={selectionTotals.radiation} />
                  </>
                )}
              </>
            ) : (
              <span className="text-sm text-slate-600">No selection</span>
            )}
          </div>
          {selectionTotals.count > 0 && !disabled && (
            <button
              type="button"
              onClick={clearSelection}
              className="text-sm text-slate-600 hover:text-teal-600 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
        <Button
          onClick={onSubmit}
          disabled={disabled || selectionTotals.count === 0}
          className="w-full"
          size="lg"
        >
          {disabled ? (
            "Submitted"
          ) : (
            <>
              Submit Order
              {mode === "quiz" && <AlertTriangle className="w-4 h-4 ml-2 text-amber-400" />}
            </>
          )}
        </Button>
        {mode === "learning" && !disabled && (
          <p className="text-xs text-slate-600 text-center mt-2">
            Learning mode: You can try multiple times
          </p>
        )}
      </div>
    </div>
  );
}
