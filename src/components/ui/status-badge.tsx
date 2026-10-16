import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex h-[1.875rem] items-center gap-2 whitespace-nowrap rounded-full pl-2.5 pr-3 text-[13px] font-semibold",
  {
    variants: {
      tone: {
        live: "bg-live-soft text-live-text",
        pause: "bg-pause-soft text-pause-text",
        alert: "bg-alert-soft text-alert-text",
        brand: "bg-brand-soft text-brand-text",
        neutral: "bg-secondary text-muted-foreground",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
);

const dotVariants = cva("size-2 shrink-0 rounded-full", {
  variants: {
    tone: {
      live: "bg-live animate-live-pulse motion-reduce:animate-none",
      pause: "bg-pause",
      alert: "bg-destructive",
      brand: "bg-brand",
      neutral: "bg-muted-foreground/60",
    },
  },
  defaultVariants: {
    tone: "neutral",
  },
});

interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {}

function StatusBadge({
  tone,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ tone }), className)} {...props}>
      <span aria-hidden="true" className={dotVariants({ tone })} />
      {children}
    </span>
  );
}

export { StatusBadge };
