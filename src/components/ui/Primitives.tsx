import { cn } from "@/lib/utils/format";

export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="h-1.5 w-full rounded-full bg-sur3 overflow-hidden">
      <div
        className="h-full rounded-full bg-vert transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

const BADGE_STYLES: Record<string, string> = {
  reading: "bg-vert-t text-vert",
  completed: "bg-sur3 text-txt2",
  on_hold: "bg-or-t text-or",
  dropped: "bg-rouge-t text-rouge",
  plan_to_read: "bg-sur3 text-txt3",
  ongoing: "bg-vert-t text-vert",
  hiatus: "bg-or-t text-or",
  cancelled: "bg-rouge-t text-rouge",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium",
        BADGE_STYLES[status] ?? "bg-sur3 text-txt3",
      )}
    >
      {label}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-3 border border-dashed border-ligne2 rounded-2xl py-16 px-6">
      {icon && <div className="text-txt3">{icon}</div>}
      <h3 className="font-display text-[17px] font-normal">{title}</h3>
      {subtitle && <p className="text-[13.5px] text-txt3 max-w-sm">{subtitle}</p>}
      {action}
    </div>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-6 h-6 rounded-full border-2 border-vert/20 border-t-vert animate-spin",
        className,
      )}
    />
  );
}
