"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  STATUS_CHIP,
  StatusCue,
  type StatusTone,
} from "@/components/ui/status-chip";

export interface CustomSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  status?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  className?: string;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, placement: "bottom" as "top" | "bottom" });
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Safe in hydration effect
    setMounted(true);
  }, []);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase()) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(search.toLowerCase()))
    );
  }, [options, search]);

  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value) || null;
  }, [options, value]);

  // Position calculation and viewport collision handling
  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      const dropdownHeight = 280; // approximate max dropdown height
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      let top = rect.bottom + scrollY;
      let placement: "top" | "bottom" = "bottom";

      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        top = rect.top - dropdownHeight - 4 + scrollY;
        placement = "top";
      } else {
        top = rect.bottom + 4 + scrollY;
        placement = "bottom";
      }

      setCoords({
        top,
        left: rect.left + scrollX,
        width: rect.width,
        placement,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      // Reset search and highlight
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Expected behavior to reset dropdown state on open
      setSearch("");
      setHighlightedIndex(-1);
      
      // Auto focus search input
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);

      window.addEventListener("resize", updateCoords);
      window.addEventListener("scroll", updateCoords, true);
    }
    return () => {
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [isOpen]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard events when open or focused
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "Space" || e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          onChange(filteredOptions[highlightedIndex].value);
          setIsOpen(false);
          triggerRef.current?.focus();
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const activeEl = dropdownRef.current.querySelector(
        `[data-index="${highlightedIndex}"]`
      ) as HTMLElement;
      const listContainer = dropdownRef.current.querySelector(
        ".options-list"
      ) as HTMLElement;

      if (activeEl && listContainer) {
        const containerTop = listContainer.scrollTop;
        const containerBottom = containerTop + listContainer.clientHeight;
        const elemTop = activeEl.offsetTop;
        const elemBottom = elemTop + activeEl.clientHeight;

        if (elemTop < containerTop) {
          listContainer.scrollTop = elemTop;
        } else if (elemBottom > containerBottom) {
          listContainer.scrollTop = elemBottom - listContainer.clientHeight;
        }
      }
    }
  }, [highlightedIndex]);

  const renderStatusBadge = (status?: string) => {
    if (!status) return null;
    const isMoving = status === "MOVING";
    const isIdle = status === "IDLE";
    
    // Branch order preserved exactly, including the fall-through to OK for an
    // unrecognised status — this picker only lists vehicles the page already accepted.
    const tone: StatusTone =
      status === "OFFLINE" ? "fault" : isIdle ? "attn" : "ok";

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border",
          STATUS_CHIP[tone]
        )}
      >
        <StatusCue tone={tone} />
        {status}
      </span>
    );
  };

  const dropdownContent = isOpen && mounted && (
    <div
      ref={dropdownRef}
      style={{
        position: "absolute",
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        width: `${coords.width}px`,
      }}
      className={cn(
        "z-[100] flex flex-col rounded-lg border border-border bg-popover text-popover-foreground shadow-lg overflow-hidden transition-all duration-100",
        coords.placement === "top"
          ? "animate-in slide-in-from-bottom-2 duration-100 origin-bottom"
          : "animate-in slide-in-from-top-2 duration-100 origin-top"
      )}
      onKeyDown={handleKeyDown}
    >
      {/* Search Input Box */}
      <div className="relative border-b border-border p-2 bg-muted/20">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={searchInputRef}
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setHighlightedIndex(0);
          }}
          placeholder="Search items..."
          className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-8 text-[16px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Options List */}
      <div className="options-list max-h-52 overflow-y-auto p-1.5 space-y-0.5 no-scrollbar">
        {filteredOptions.length === 0 ? (
          <div className="px-3 py-4 text-center text-[15px] text-muted-foreground">
            No items found.
          </div>
        ) : (
          filteredOptions.map((option, index) => {
            const isSelected = option.value === value;
            const isHighlighted = index === highlightedIndex;

            return (
              <button
                key={option.value}
                data-index={index}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                  triggerRef.current?.focus();
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-[15px] transition-colors outline-none",
                  isHighlighted || isSelected
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "hover:bg-muted/50 text-foreground"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="truncate font-semibold">
                    {option.label}
                  </div>
                  {option.status && renderStatusBadge(option.status)}
                </div>
                
                <div className="flex items-center gap-2">
                  {option.sublabel && (
                    <span className="text-[14px] text-muted-foreground font-medium">
                      {option.sublabel}
                    </span>
                  )}
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-lg border border-input bg-card px-4 text-[16px] font-medium outline-none transition-colors hover:bg-muted/40 cursor-pointer select-none focus:border-ring focus:ring-2 focus:ring-ring",
          isOpen && "border-ring ring-2 ring-ring",
          className
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption ? (
            <>
              <span className="truncate">{selectedOption.label}</span>
              {selectedOption.status && renderStatusBadge(selectedOption.status)}
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && mounted && createPortal(dropdownContent, document.body)}
    </div>
  );
}
