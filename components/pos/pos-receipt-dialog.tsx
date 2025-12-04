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

  const orderSubtotal = order.subtotal ?? 0
  const orderDiscount = order.discount_amount ?? 0
  const orderTax = order.tax_amount ?? 0
  const orderTotal = order.total_amount ?? order.total ?? 0
  const orderItems = order.items ?? []
  const orderPayments = order.payments ?? []

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
            <h3 className="font-semibold">Luxe Collections</h3>
            <p className="text-xs text-muted-foreground">Nairobi, Kenya</p>
            <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(order.created_at)}</p>
            <p className="font-mono text-xs text-muted-foreground">#{order.order_number}</p>
          </div>

          <Separator className="my-3" />

          {/* Items - Show all order items with per-item VAT */}
          <div className="space-y-2 text-sm">
            {orderItems.length > 0 ? (
              orderItems.map((item, index) => (
                <div key={item.id || index} className="space-y-0.5">
                  <div className="flex justify-between">
                    <div className="flex-1">
                      <span>{item.quantity}x </span>
                      <span>{item.product_name}</span>
                      {item.variant_name && <span className="text-muted-foreground"> ({item.variant_name})</span>}
                    </div>
                    <span>{formatCurrency(item.unit_price * item.quantity)}</span>
                  </div>
                  {/* Show item-level discount and tax */}
                  {(item.discount_amount > 0 || item.tax_amount > 0) && (
                    <div className="flex justify-between text-xs text-muted-foreground pl-4">
                      {item.discount_amount > 0 && (
                        <span className="text-success">-{formatCurrency(item.discount_amount)} disc.</span>
                      )}
                      {item.tax_amount > 0 && <span className="ml-auto">+{formatCurrency(item.tax_amount)} VAT</span>}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground">No items</p>
            )}
          </div>

          <Separator className="my-3" />

          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(orderSubtotal)}</span>
            </div>
            {orderDiscount > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount</span>
                <span>-{formatCurrency(orderDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">VAT</span>
              <span>{formatCurrency(orderTax)}</span>
            </div>
            <div className="flex justify-between pt-2 text-lg font-semibold">
              <span>Total</span>
              <span>{formatCurrency(orderTotal)}</span>
            </div>
          </div>

          <Separator className="my-3" />

          {/* Payment Info - Show all payments with method */}
          <div className="space-y-1 text-center text-xs text-muted-foreground">
            {orderPayments.length > 0 ? (
              orderPayments.map((payment, index) => (
                <div key={payment.id || index}>
                  <p>
                    Paid via <span className="font-medium uppercase">{payment.payment_method}</span>:{" "}
                    {formatCurrency(payment.amount)}
                  </p>
                  {payment.mpesa_receipt && <p>M-Pesa Ref: {payment.mpesa_receipt}</p>}
                  {payment.reference_number && <p>Ref: {payment.reference_number}</p>}
                </div>
              ))
            ) : (
              <p>Payment recorded</p>
            )}
            {/* Show change if applicable */}
            {order.change_amount > 0 && (
              <p className="font-medium text-foreground">Change: {formatCurrency(order.change_amount)}</p>
            )}
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
