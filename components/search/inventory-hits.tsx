"use client"

import { useHits, useInstantSearch } from "react-instantsearch"
import { Package, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatNumber } from "@/lib/format"
import type { AlgoliaInventory } from "@/lib/algolia"

interface InventoryHitsProps {
  onAdjustStock: (item: AlgoliaInventory, type: "add" | "remove") => void
}

export function InventoryHits({ onAdjustStock }: InventoryHitsProps) {
  const { hits } = useHits<AlgoliaInventory>()
  const { status } = useInstantSearch()

  const loading = status === "loading" || status === "stalled"

  const getStockStatus = (item: AlgoliaInventory): "out" | "low" | "active" => {
    if (item.quantity <= 0) return "out"
    if (item.is_low_stock) return "low"
    return "active"
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    )
  }

  if (hits.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border">
        <Package className="h-10 w-10 text-muted-foreground" />
        <p className="mt-4 text-lg font-medium text-foreground">No inventory found</p>
        <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-3 text-left text-sm font-medium">Product</th>
            <th className="p-3 text-left text-sm font-medium">SKU</th>
            <th className="p-3 text-left text-sm font-medium">Location</th>
            <th className="p-3 text-center text-sm font-medium">In Stock</th>
            <th className="p-3 text-center text-sm font-medium">Reserved</th>
            <th className="p-3 text-center text-sm font-medium">Available</th>
            <th className="p-3 text-left text-sm font-medium">Status</th>
            <th className="p-3 text-right text-sm font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {hits.map((item) => {
            const status = getStockStatus(item)
            const available = item.quantity - item.reserved_quantity
            return (
              <tr key={item.objectID} className="border-b last:border-0">
                <td className="p-3">
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    {item.variant_options && (
                      <p className="text-xs text-muted-foreground">{Object.values(item.variant_options).join(" / ")}</p>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <span className="font-mono text-sm">{item.variant_sku || item.product_sku}</span>
                </td>
                <td className="p-3 text-sm">{item.location_name}</td>
                <td className="p-3 text-center font-medium">{formatNumber(item.quantity)}</td>
                <td className="p-3 text-center text-muted-foreground">{formatNumber(item.reserved_quantity)}</td>
                <td className="p-3 text-center font-medium">{formatNumber(available)}</td>
                <td className="p-3">
                  <StatusBadge status={status} />
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-transparent"
                      onClick={() => onAdjustStock(item, "add")}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-transparent"
                      onClick={() => onAdjustStock(item, "remove")}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
