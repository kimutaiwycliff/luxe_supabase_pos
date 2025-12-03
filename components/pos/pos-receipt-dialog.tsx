"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, formatDateTime } from "@/lib/format"
import { Printer, Share2, CheckCircle2 } from "lucide-react"
import type { Order } from "@/lib/types"

interface POSReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
}

export function POSReceiptDialog({ open, onOpenChange, order }: POSReceiptDialogProps) {
  if (!order) return null

  const handlePrint = () => {
    window.print()
  }

  const orderTotal = order.total_amount ?? order.total ?? 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex flex-col items-center text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <DialogTitle>Payment Successful!</DialogTitle>
          </div>
        </DialogHeader>

        {/* Receipt */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-center">
            <h3 className="font-semibold">Boutique Store</h3>
            <p className="text-xs text-muted-foreground">Nairobi, Kenya</p>
            <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(order.created_at)}</p>
            <p className="font-mono text-xs text-muted-foreground">#{order.order_number}</p>
          </div>

          <Separator className="my-3" />

          {/* Items */}
          <div className="space-y-2 text-sm">
            {order.items?.map((item, index) => (
              <div key={index} className="flex justify-between">
                <div>
                  <span>{item.quantity}x </span>
                  <span>{item.product_name}</span>
                  {item.variant_name && <span className="text-muted-foreground"> ({item.variant_name})</span>}
                </div>
                <span>{formatCurrency(item.total_amount ?? item.total ?? 0)}</span>
              </div>
            ))}
          </div>

          <Separator className="my-3" />

          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount</span>
                <span>-{formatCurrency(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">VAT</span>
              <span>{formatCurrency(order.tax_amount)}</span>
            </div>
            <div className="flex justify-between pt-2 text-lg font-semibold">
              <span>Total</span>
              <span>{formatCurrency(orderTotal)}</span>
            </div>
          </div>

          <Separator className="my-3" />

          {/* Payment Info */}
          <div className="text-center text-xs text-muted-foreground">
            {order.payments?.map((payment, index) => (
              <p key={index}>
                Paid via {payment.payment_method.toUpperCase()}: {formatCurrency(payment.amount)}
                {payment.mpesa_receipt && <span className="block">Ref: {payment.mpesa_receipt}</span>}
              </p>
            ))}
          </div>

          <Separator className="my-3" />

          <p className="text-center text-xs text-muted-foreground">Thank you for your purchase!</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" className="flex-1 bg-transparent">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>

        <Button className="w-full" onClick={() => onOpenChange(false)}>
          New Sale
        </Button>
      </DialogContent>
    </Dialog>
  )
}
