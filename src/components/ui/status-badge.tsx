import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center whitespace-nowrap rounded-full font-semibold",
  {
    variants: {
      tone: {
        live: "bg-live-soft text-live-text",
        pause: "bg-pause-soft text-pause-text",
        alert: "bg-alert-soft text-alert-text",
        brand: "bg-brand-soft text-brand-text",
        neutral: "bg-secondary text-muted-foreground",
      },
      size: {
        md: "h-[1.875rem] gap-2 px-3 text-[13px]",
        sm: "h-6 gap-1.5 px-2.5 text-xs",
      },
    },
    defaultVariants: {
      tone: "neutral",
      size: "md",
    },
  }
);

const dotVariants = cva("shrink-0 rounded-full", {
  variants: {
    tone: {
      live: "bg-live",
      pause: "bg-pause",
      alert: "bg-destructive",
      brand: "bg-brand",
      neutral: "bg-muted-foreground/60",
    },
    size: {
      md: "-ml-0.5 size-2",
      sm: "-ml-0.5 size-1.5",
    },
  },
  defaultVariants: {
    tone: "neutral",
    size: "md",
  },
});

interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  /** Shows the colored dot before the label. */
  dot?: boolean;
  /** Pulses the dot to signal something happening right now. */
  pulse?: boolean;
}

function StatusBadge({
  tone,
  size,
  dot = true,
  pulse = false,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(statusBadgeVariants({ tone, size }), className)}
      {...props}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cn(
            dotVariants({ tone, size }),
            pulse && "animate-live-pulse motion-reduce:animate-none"
          )}
        />
      )}
      {children}
    </span>
  );
}

export { StatusBadge };
