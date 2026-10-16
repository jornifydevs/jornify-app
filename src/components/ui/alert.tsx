import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm font-medium [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        error: "bg-alert-soft text-alert-text",
        success: "bg-live-soft text-live-text",
        warning: "bg-brand-soft text-brand-text",
        info: "bg-secondary text-foreground",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

function Alert({ variant, className, role, ...props }: AlertProps) {
  return (
    <div
      role={role ?? (variant === "error" ? "alert" : "status")}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Alert };
