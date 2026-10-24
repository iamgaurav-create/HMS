"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

function Select({
  onValueChange,
  ...props
}: SelectPrimitive.Root.Props<any>) {
  return (
    <SelectPrimitive.Root
      data-slot="select"
      onValueChange={onValueChange as any}
      {...props}
    />
  )
}

function SelectTrigger({
  className,
  children,
  ...props
}: SelectPrimitive.Trigger.Props) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "border-input bg-background placeholder:text-muted-foreground focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 relative flex h-8 w-full min-w-0 items-center justify-between rounded-lg border px-2.5 py-1 text-base outline-none transition-colors data-disabled:cursor-not-allowed data-disabled:opacity-50 md:text-sm text-foreground dark:text-foreground dark:bg-card",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="size-4 shrink-0 opacity-50" />
    </SelectPrimitive.Trigger>
  )
}

function SelectValue({
  placeholder,
  ...props
}: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      placeholder={placeholder}
      {...props}
    />
  )
}

function SelectContent({
  className,
  children,
  ...props
}: SelectPrimitive.Popup.Props) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner>
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn(
            "z-50 min-w-[8rem] overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md data-open:animate-in data-closed:fade-out-0 data-side=bottom:slide-in-from-top-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
            className
          )}
          {...props}
        >
          <SelectPrimitive.List className="max-h-[var(--dropdown-width)] overflow-y-auto">
            {children}
          </SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({
  className,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none focus:bg-muted focus:text-accent-foreground data-highlighted:bg-muted data-highlighted:text-accent-foreground data-disabled:cursor-not-allowed data-disabled:opacity-50 data-selected:bg-primary data-selected:text-primary-foreground dark:focus:bg-slate-800 dark:focus:text-slate-100 dark:data-highlighted:bg-slate-800 dark:data-highlighted:text-slate-100 dark:text-slate-200",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText />
      <SelectPrimitive.ItemIndicator
        data-slot="select-item-indicator"
        className="absolute right-2 flex size-4 items-center justify-center"
      >
        <span className="size-2 rounded-full bg-primary" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
}
