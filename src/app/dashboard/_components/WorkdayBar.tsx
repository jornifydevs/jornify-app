import { cn } from "@/lib/utils";
import type { WorkdayTimeline } from "@/lib/workday-timeline";

interface WorkdayBarProps {
  timeline: WorkdayTimeline;
  startLabel: string;
  endLabel: string;
  label: string;
}

export function WorkdayBar({
  timeline,
  startLabel,
  endLabel,
  label,
}: WorkdayBarProps) {
  return (
    <div className="space-y-2">
      <div
        role="img"
        aria-label={label}
        className="relative h-3 rounded-full bg-track"
      >
        {timeline.segments.map((segment, index) => (
          <span
            key={index}
            className={cn(
              "absolute inset-y-0 rounded-full",
              segment.kind === "work" ? "bg-live" : "bg-pause-stripes"
            )}
            style={{ left: `${segment.start}%`, width: `${segment.width}%` }}
          />
        ))}
        {timeline.now !== null && (
          <span
            className="absolute -inset-y-1.5 w-0.5 -translate-x-1/2 rounded-full bg-foreground"
            style={{ left: `${timeline.now}%` }}
          />
        )}
      </div>
      <div className="flex justify-between text-[11px] font-medium tabular-nums text-muted-foreground">
        <span>{startLabel}</span>
        <span>{endLabel}</span>
      </div>
    </div>
  );
}
