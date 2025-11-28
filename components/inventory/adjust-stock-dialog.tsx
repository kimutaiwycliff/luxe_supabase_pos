"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { adjustInventory } from "@/lib/actions/inventory"
import type { Inventory } from "@/lib/types"
import { Loader2 } from "lucide-react"

interface AdjustStockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: Inventory | null
  type: "add" | "remove"
  onSuccess: () => void
}

const adjustmentReasons = {
  add: [
    { value: "adjustment", label: "Stock Adjustment" },
    { value: "return", label: "Customer Return" },
  ],
  remove: [
    { value: "adjustment", label: "Stock Adjustment" },
    { value: "damage", label: "Damaged/Lost" },
  ],
}

export function AdjustStockDialog({ open, onOpenChange, item, type, onSuccess }: AdjustStockDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState<string>("adjustment")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setQuantity(1)
      setReason("adjustment")
      setNotes("")
      setError(null)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item) return

    setIsLoading(true)
    setError(null)

    const adjustedQuantity = type === "add" ? quantity : -quantity

    const result = await adjustInventory({
      product_id: item.product_id || undefined,
      variant_id: item.variant_id || undefined,
      location_id: item.location_id,
      quantity: adjustedQuantity,
      movement_type: reason as "adjustment" | "damage" | "return",
      notes: notes || undefined,
    })

    setIsLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      onSuccess()
    }
  }

  const productName = item?.variant
    ? `${item.product?.name} (${Object.values(item.variant.option_values).join(" / ")})`
    : item?.product?.name || "Unknown Product"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{type === "add" ? "Add Stock" : "Remove Stock"}</DialogTitle>
          <DialogDescription>{productName}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg bg-secondary p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current Stock</span>
              <span className="font-semibold">{item?.quantity || 0}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">After Adjustment</span>
              <span className="font-semibold">
                {type === "add" ? (item?.quantity || 0) + quantity : Math.max(0, (item?.quantity || 0) - quantity)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {adjustmentReasons[type].map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any relevant notes..."
              rows={2}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} variant={type === "remove" ? "destructive" : "default"}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {type === "add" ? "Add Stock" : "Remove Stock"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
