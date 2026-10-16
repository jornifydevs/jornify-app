import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const logoVariants = cva(
  "inline-flex items-center font-semibold tracking-[-0.045em] text-foreground",
  {
    variants: {
      size: {
        md: "gap-2.5 text-[21px]",
        lg: "gap-3 text-[32px]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const markVariants = cva(
  "inline-flex shrink-0 items-center justify-center bg-brand text-brand-foreground",
  {
    variants: {
      size: {
        md: "size-8 rounded-[10px] [&_svg]:size-5",
        lg: "size-12 rounded-[14px] [&_svg]:size-7",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

interface JornifyLogoProps extends VariantProps<typeof logoVariants> {
  className?: string;
}

export function JornifyLogo({ size, className }: JornifyLogoProps) {
  return (
    <span className={cn(logoVariants({ size }), className)}>
      <span aria-hidden="true" className={markVariants({ size })}>
        <svg viewBox="0 0 20 20" fill="none">
          <circle cx="12.5" cy="4" r="2" fill="currentColor" />
          <path
            d="M12.5 8.5v5.25a4.5 4.5 0 0 1-9 0"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
      jornify
    </span>
  );
}
