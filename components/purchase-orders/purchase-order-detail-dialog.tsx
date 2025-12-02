"use client"

import { useState, useEffect } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Send, Truck, CheckCircle2, XCircle, Package } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import {
  updatePurchaseOrderStatus,
  receivePurchaseOrder,
  type PurchaseOrderStatus,
} from "@/lib/actions/purchase-orders"
import { getLocations } from "@/lib/actions/inventory"
import { formatCurrency, formatDate } from "@/lib/format"
import { toast } from "sonner"

interface PurchaseOrderItem {
  id: string
  quantity_ordered: number
  quantity_received: number
  unit_cost: number
  product: { id: string; name: string; sku: string } | null
  variant: { id: string; sku: string; variant_name: string } | null
}

interface PurchaseOrder {
  id: string
  po_number: string
  status: PurchaseOrderStatus
  total_amount: number
  notes: string | null
  created_at: string
  sent_at: string | null
  expected_at: string | null
  received_at: string | null
  supplier: {
    id: string
    name: string
    email: string | null
    phone: string | null
  } | null
  items: PurchaseOrderItem[]
}

interface Location {
  id: string
  name: string
}

interface PurchaseOrderDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: PurchaseOrder
  onUpdate: () => void
}

const statusConfig: Record<
  PurchaseOrderStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Sent", variant: "default" },
  confirmed: { label: "Confirmed", variant: "default" },
  shipped: { label: "Shipped", variant: "default" },
  received: { label: "Received", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
}

export function PurchaseOrderDetailDialog({ open, onOpenChange, order, onUpdate }: PurchaseOrderDetailDialogProps) {
  const [loading, setLoading] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>("")
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({})
  const [showReceiveMode, setShowReceiveMode] = useState(false)

  useEffect(() => {
    if (open) {
      loadLocations()
      const initial: Record<string, number> = {}
      order.items.forEach((item) => {
        initial[item.id] = item.quantity_ordered - item.quantity_received
      })
      setReceivedQuantities(initial)
    }
  }, [open, order])

  const loadLocations = async () => {
    try {
      const result = await getLocations()
      setLocations(result.locations || [])
      if (result.locations?.length > 0) {
        setSelectedLocation(result.locations[0].id)
      }
    } catch (error) {
      console.error("Failed to load locations:", error)
    }
  }

  const handleStatusChange = async (newStatus: PurchaseOrderStatus) => {
    setLoading(true)
    try {
      await updatePurchaseOrderStatus(order.id, newStatus)
      toast.success(`Order marked as ${newStatus}`)
      onUpdate()
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to update status:", error)
      toast.error("Failed to update order status")
    } finally {
      setLoading(false)
    }
  }

  const handleReceive = async () => {
    if (!selectedLocation) {
      toast.error("Please select a location")

      return
    }

    const itemsToReceive = Object.entries(receivedQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([itemId, qty]) => ({
        item_id: itemId,
        quantity_received: qty,
      }))

    if (itemsToReceive.length === 0) {
      toast.info("Please enter quantities to receive")
      return
    }

    setLoading(true)
    try {
      await receivePurchaseOrder(order.id, itemsToReceive, selectedLocation)
      toast.success("Stock received and inventory updated")
      onUpdate()
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to receive order:", error)
      toast.error("Failed to receive order")
    } finally {
      setLoading(false)
    }
  }

  const status = statusConfig[order.status]

  const columns: ColumnDef<PurchaseOrderItem>[] = [
    {
      accessorKey: "product.name",
      header: "Product",
      cell: ({ row }) => {
        const item = row.original
        return (
          <div>
            <p className="font-medium">{item.product?.name || "Unknown"}</p>
            <p className="text-sm text-muted-foreground">{item.variant?.variant_name || item.product?.sku}</p>
          </div>
        )
      },
    },
    {
      accessorKey: "quantity_ordered",
      header: () => <div className="text-right">Ordered</div>,
      cell: ({ row }) => <div className="text-right">{row.getValue("quantity_ordered")}</div>,
      meta: { className: "text-right" },
    },
    {
      accessorKey: "quantity_received",
      header: () => <div className="text-right">Received</div>,
      cell: ({ row }) => <div className="text-right">{row.getValue("quantity_received")}</div>,
      meta: { className: "text-right" },
    },
    {
      accessorKey: "unit_cost",
      header: () => <div className="text-right">Unit Cost</div>,
      cell: ({ row }) => <div className="text-right">{formatCurrency(row.getValue("unit_cost"))}</div>,
      meta: { className: "text-right" },
    },
    {
      id: "total",
      header: () => <div className="text-right">Total</div>,
      cell: ({ row }) => {
        const item = row.original
        return <div className="text-right">{formatCurrency(item.quantity_ordered * item.unit_cost)}</div>
      },
      meta: { className: "text-right" },
    },
    ...(showReceiveMode
      ? [
        {
          id: "receive_now",
          header: () => <div className="text-right">Receive Now</div>,
          cell: ({ row }: { row: { original: PurchaseOrderItem } }) => {
            const item = row.original
            return (
              <Input
                type="number"
                min="0"
                max={item.quantity_ordered - item.quantity_received}
                value={receivedQuantities[item.id] || 0}
                onChange={(e) =>
                  setReceivedQuantities({
                    ...receivedQuantities,
                    [item.id]: Number.parseInt(e.target.value) || 0,
                  })
                }
                className="w-20 h-8 text-right ml-auto"
              />
            )
          },
          meta: { className: "text-right" },
        } as ColumnDef<PurchaseOrderItem>,
      ]
      : []),
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              {order.po_number}
              <Badge variant={status.variant}>{status.label}</Badge>
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Supplier Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Supplier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="font-medium">{order.supplier?.name || "Unknown"}</p>
                  {order.supplier?.email && <p className="text-sm text-muted-foreground">{order.supplier.email}</p>}
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Created: {formatDate(order.created_at)}</p>
                  {order.sent_at && <p>Sent: {formatDate(order.sent_at)}</p>}
                  {order.received_at && <p>Received: {formatDate(order.received_at)}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items - using DataTable */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Items</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={order.items}
                showSearch={false}
                showColumnToggle={false}
                showPagination={false}
                emptyMessage="No items in this order"
              />

              <div className="flex justify-end pt-4 border-t mt-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-xl font-semibold">{formatCurrency(order.total_amount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Receive Location */}
          {showReceiveMode && (
            <div className="space-y-2">
              <Label>Receive to Location</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="text-sm">
              <p className="font-medium mb-1">Notes</p>
              <p className="text-muted-foreground">{order.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {order.status === "draft" && (
              <>
                <Button onClick={() => handleStatusChange("sent")} disabled={loading}>
                  <Send className="mr-2 h-4 w-4" />
                  Mark as Sent
                </Button>
                <Button variant="destructive" onClick={() => handleStatusChange("cancelled")} disabled={loading}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Order
                </Button>
              </>
            )}
            {order.status === "sent" && (
              <Button onClick={() => handleStatusChange("confirmed")} disabled={loading}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark as Confirmed
              </Button>
            )}
            {order.status === "confirmed" && (
              <Button onClick={() => handleStatusChange("shipped")} disabled={loading}>
                <Truck className="mr-2 h-4 w-4" />
                Mark as Shipped
              </Button>
            )}
            {(order.status === "shipped" || order.status === "confirmed") && !showReceiveMode && (
              <Button onClick={() => setShowReceiveMode(true)}>
                <Package className="mr-2 h-4 w-4" />
                Receive Stock
              </Button>
            )}
            {showReceiveMode && (
              <>
                <Button onClick={handleReceive} disabled={loading}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirm Receipt
                </Button>
                <Button variant="outline" onClick={() => setShowReceiveMode(false)}>
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
