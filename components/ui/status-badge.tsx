import { cn } from "@/lib/utils"

type Status =
  | "pending"
  | "processing"
  | "completed"
  | "cancelled"
  | "refunded"
  | "paid"
  | "partial"
  | "failed"
  | "draft"
  | "sent"
  | "received"
  | "ordered"
  | "dismissed"
  | "active"
  | "inactive"
  | "low"
  | "out"

const statusStyles: Record<Status, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  processing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  completed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-muted text-muted-foreground border-border",
  refunded: "bg-muted text-muted-foreground border-border",
  paid: "bg-success/10 text-success border-success/20",
  partial: "bg-warning/10 text-warning border-warning/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  draft: "bg-muted text-muted-foreground border-border",
  sent: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  received: "bg-success/10 text-success border-success/20",
  ordered: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  dismissed: "bg-muted text-muted-foreground border-border",
  active: "bg-success/10 text-success border-success/20",
  inactive: "bg-muted text-muted-foreground border-border",
  low: "bg-warning/10 text-warning border-warning/20",
  out: "bg-destructive/10 text-destructive border-destructive/20",
}

interface StatusBadgeProps {
  status: Status
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
        statusStyles[status],
        className,
      )}
    >
      {status}
    </span>
  )
}
