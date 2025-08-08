"use client";

import { Check, ChevronsUpDown, X } from "lucide-react";
import * as React from "react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export interface Option {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleUnselect = (item: string) => {
    onChange(selected.filter((i) => i !== item));
  };

  const handleSelect = (item: string) => {
    if (selected.includes(item)) {
      onChange(selected.filter((i) => i !== item));
    } else {
      onChange([...selected, item]);
    }
  };

  const handleSelectAll = () => {
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((option) => option.value));
    }
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const getDisplayText = () => {
    if (selected.length === 0) {
      return placeholder;
    } else if (selected.length === 1) {
      const option = options.find((opt) => opt.value === selected[0]);
      return option?.label || selected[0];
    } else {
      const variantName = placeholder.toLowerCase().includes("model")
        ? "models"
        : "items";
      return `${selected.length} ${variantName} selected`;
    }
  };

  return (
    <div className="relative shrink grow">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "rounded-radius border-border hover:bg-accent hover:text-accent-foreground w-full justify-between pr-16 text-left font-normal shadow-none",
              className,
            )}
            onClick={() => setOpen(!open)}
          >
            <span
              className={cn(
                "truncate pr-4",
                selected.length > 0
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {getDisplayText()}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="border-border w-full p-0 shadow-none"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandGroup>
              <CommandList>
                <CommandItem onSelect={handleSelectAll}>
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected.length === options.length
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {selected.length === options.length
                    ? "Deselect All"
                    : "Select All"}
                </CommandItem>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selected.includes(option.value)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandList>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      {selected.length > 0 && (
        <button
          type="button"
          className="hover:bg-muted absolute right-8 top-1/2 z-10 -translate-y-1/2 rounded-sm p-1"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleClearAll();
          }}
        >
          <X className="text-muted-foreground hover:text-foreground h-3 w-3" />
        </button>
      )}
    </div>
  );
}
