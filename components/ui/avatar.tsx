import * as React from "react";
import { cn } from "@/lib/utils";

export function Avatar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 dark:border-slate-800 shadow-xs",
        className
      )}
    >
      {children}
    </div>
  );
}

export function AvatarImage({
  src,
  alt = "",
  className,
}: {
  src?: string | null;
  alt?: string;
  className?: string;
}) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      className={cn("aspect-square h-full w-full object-cover", className)}
    />
  );
}

export function AvatarFallback({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-sky-100 text-sky-700 font-semibold text-xs dark:bg-sky-950 dark:text-sky-300",
        className
      )}
    >
      {children}
    </div>
  );
}
