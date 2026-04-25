"use client"

import { useState, useTransition } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatusBadge } from "@/components/ui/status-badge"
import { updateOrderStatus } from "@/lib/actions/orders"
import { formatCurrency } from "@/lib/format"
import { toast } from "sonner"
import type { Order } from "@/lib/types"

const ORDER_STATUSES: { value: Order["status"]; label: string; description: string }[] = [
  { value: "draft",              label: "Draft",             description: "Received, not yet processed" },
  { value: "processing",         label: "Processing",        description: "Being prepared / packed" },
  { value: "completed",          label: "Completed",         description: "Fulfilled and closed" },
  { value: "cancelled",          label: "Cancelled",         description: "Cancelled by admin or customer" },
  { value: "voided",             label: "Voided",            description: "Voided before fulfilment" },
  { value: "refunded",           label: "Refunded",          description: "Full refund issued" },
  { value: "partially_refunded", label: "Partially Refunded", description: "Partial refund issued" },
  { value: "layaway",            label: "Layaway",           description: "Held on layaway, deposit paid" },
]

const PAYMENT_STATUSES: { value: Order["payment_status"]; label: string }[] = [
  { value: "pending",   label: "Pending" },
  { value: "partial",   label: "Partial" },
  { value: "paid",      label: "Paid" },
  { value: "completed", label: "Completed" },
  { value: "failed",    label: "Failed" },
  { value: "refunded",  label: "Refunded" },
]

interface OrderStatusDialogProps {
  order: Order
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function OrderStatusDialog({ order, open, onOpenChange, onSuccess }: OrderStatusDialogProps) {
  const [status, setStatus] = useState<Order["status"]>(order.status)
  const [paymentStatus, setPaymentStatus] = useState<Order["payment_status"]>(order.payment_status)
  const [notes, setNotes] = useState(order.notes ?? "")
  const [pending, startTransition] = useTransition()

  const isDirty =
    status !== order.status ||
    paymentStatus !== order.payment_status ||
    notes !== (order.notes ?? "")

  function handleSave() {
    startTransition(async () => {
      const result = await updateOrderStatus(order.id, {
        status: status !== order.status ? status : undefined,
        payment_status: paymentStatus !== order.payment_status ? paymentStatus : undefined,
        notes: notes !== (order.notes ?? "") ? notes : undefined,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Order ${order.order_number} updated`)
        onSuccess()
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Order — {order.order_number}</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {formatCurrency(order.total_amount)} ·{" "}
            {order.customer_email ?? order.customer
              ? `${order.customer?.first_name} ${order.customer?.last_name}`
              : "Walk-in"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Current state */}
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Current:</span>
            <StatusBadge status={order.status} />
            <StatusBadge status={order.payment_status} />
          </div>

          {/* Order status */}
          <div className="space-y-1.5">
            <Label>Order Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as Order["status"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <div className="flex flex-col">
                      <span>{s.label}</span>
                      <span className="text-xs text-muted-foreground">{s.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment status */}
          <div className="space-y-1.5">
            <Label>Payment Status</Label>
            <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as Order["payment_status"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Internal Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for status change, refund details, etc."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={pending || !isDirty}>
            {pending ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
