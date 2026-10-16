import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Parent page for detail screens; top-level pages rely on the shell. */
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
}

export function PageHeader({
  title,
  description,
  backHref,
  backLabel,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        {backHref && (
          <Link
            href={backHref}
            aria-label={backLabel}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-track focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-[-0.025em]">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
