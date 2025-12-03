"use client"

import { Button } from "@/components/ui/button"
import { formatNumber } from "@/lib/format"
import { Package } from "lucide-react"
import Link from "next/link"
import type { LowStockItem } from "@/lib/actions/dashboard"

interface LowStockAlertProps {
  items: LowStockItem[]
}

export function LowStockAlert({ items }: LowStockAlertProps) {
  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Package className="h-10 w-10 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">All products are well stocked</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.variant_id || item.id}
          className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-3"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
            <p className="text-xs text-muted-foreground">{item.sku}</p>
          </div>
          <div className="ml-4 text-right">
            <p className={`text-sm font-semibold ${item.quantity === 0 ? "text-destructive" : "text-warning"}`}>
              {item.quantity === 0 ? "Out of stock" : `${formatNumber(item.quantity)} left`}
            </p>
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
              <Link href="/reorder">Reorder</Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
