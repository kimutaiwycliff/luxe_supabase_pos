"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatCurrency, formatRelativeTime } from "@/lib/format"
import type { Order } from "@/lib/types"
import { Package, User, CreditCard, TrendingUp } from "lucide-react"

interface OrderDetailSheetProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function paymentMethodLabel(method: string) {
  const map: Record<string, string> = {
    cash: "Cash",
    mpesa: "M-Pesa",
    card: "Card",
    bank_transfer: "Bank Transfer",
    credit: "Credit",
  }
  return map[method] ?? method
}

export function OrderDetailSheet({ order, open, onOpenChange }: OrderDetailSheetProps) {
  if (!order) return null

  const items = order.items ?? []
  const payments = order.payments ?? []

  const itemsProfit = items.reduce((sum, item) => {
    const revenue = item.unit_price * item.quantity - (item.discount_amount ?? 0)
    const cost = (item.cost_price ?? 0) * item.quantity
    return sum + (revenue - cost)
  }, 0)

  const customerName = order.customer
    ? `${order.customer.first_name} ${order.customer.last_name}`
    : order.layaway_customer_name ?? "Walk-in"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0 overflow-hidden">
        {/* Header */}
        <SheetHeader className="px-5 py-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-base">{order.order_number}</SheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatRelativeTime(order.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <StatusBadge status={order.status} />
              <StatusBadge status={order.payment_status} />
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Customer */}
          <div className="px-5 py-3 border-b">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="font-medium">{customerName}</span>
              {order.customer?.email && (
                <span className="text-muted-foreground text-xs">· {order.customer.email}</span>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="px-5 py-4 border-b">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-medium">Items ({items.length})</span>
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No items recorded</p>
            ) : (
              <div className="space-y-3">
                {items.map((item) => {
                  const itemRevenue = item.unit_price * item.quantity - (item.discount_amount ?? 0)
                  const itemCost = (item.cost_price ?? 0) * item.quantity
                  const itemProfit = itemRevenue - itemCost
                  const margin = itemRevenue > 0 ? (itemProfit / itemRevenue) * 100 : 0

                  return (
                    <div key={item.id} className="rounded-lg border bg-card p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-tight">{item.product_name}</p>
                          {item.variant_name && (
                            <p className="text-xs text-muted-foreground">{item.variant_name}</p>
                          )}
                        </div>
                        <span className="text-sm font-semibold shrink-0">
                          {formatCurrency(item.total_amount)}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-x-3 text-xs text-muted-foreground">
                        <div>
                          <span className="block">Qty × Price</span>
                          <span className="text-foreground font-medium">
                            {item.quantity} × {formatCurrency(item.unit_price)}
                          </span>
                        </div>
                        {(item.discount_amount ?? 0) > 0 && (
                          <div>
                            <span className="block">Discount</span>
                            <span className="text-destructive font-medium">
                              -{formatCurrency(item.discount_amount ?? 0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="block">Profit</span>
                          <span className={itemProfit >= 0 ? "text-green-600 font-medium" : "text-destructive font-medium"}>
                            {formatCurrency(itemProfit)}
                            <span className="text-muted-foreground font-normal ml-1">
                              ({margin.toFixed(0)}%)
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Order totals */}
          <div className="px-5 py-4 border-b space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Discount</span>
                <span>-{formatCurrency(order.discount_amount)}</span>
              </div>
            )}
            {order.tax_amount > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Tax (VAT)</span>
                <span>{formatCurrency(order.tax_amount)}</span>
              </div>
            )}
            <Separator className="my-1" />
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
            {order.paid_amount > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Paid</span>
                <span>{formatCurrency(order.paid_amount)}</span>
              </div>
            )}
            {order.change_amount > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Change</span>
                <span>{formatCurrency(order.change_amount)}</span>
              </div>
            )}
          </div>

          {/* Payments */}
          {payments.length > 0 && (
            <div className="px-5 py-4 border-b">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">Payment</span>
              </div>
              <div className="space-y-1.5">
                {payments.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{paymentMethodLabel(p.payment_method)}</span>
                    <span className="font-medium">{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Profit summary */}
          {items.length > 0 && (
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">Profit</span>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Revenue</span>
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Cost of goods</span>
                  <span>
                    {formatCurrency(
                      items.reduce((s, i) => s + (i.cost_price ?? 0) * i.quantity, 0)
                    )}
                  </span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between font-semibold">
                  <span>Gross profit</span>
                  <span className={itemsProfit >= 0 ? "text-green-600" : "text-destructive"}>
                    {formatCurrency(itemsProfit)}
                  </span>
                </div>
                {order.total_amount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Margin: {((itemsProfit / order.total_amount) * 100).toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
