"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Search, Package, ChevronRight, Truck, CheckCircle2, XCircle, Clock, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreatePurchaseOrderDialog } from "./create-purchase-order-dialog"
import { PurchaseOrderDetailDialog } from "./purchase-order-detail-dialog"
import { getPurchaseOrders, type PurchaseOrderStatus } from "@/lib/actions/purchase-orders"
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

const statusConfig: Record<
  PurchaseOrderStatus,
  {
    label: string
    variant: "default" | "secondary" | "destructive" | "outline"
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  draft: { label: "Draft", variant: "secondary", icon: Clock },
  sent: { label: "Sent", variant: "default", icon: Send },
  confirmed: { label: "Confirmed", variant: "default", icon: CheckCircle2 },
  shipped: { label: "Shipped", variant: "default", icon: Truck },
  received: { label: "Received", variant: "outline", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", variant: "destructive", icon: XCircle },
}

export function PurchaseOrdersContent() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)

  const loadOrders = async () => {
    try {
      const data = await getPurchaseOrders()
      setOrders(data || [])
    } catch (error) {
      console.error("Failed to load purchase orders:", error)
      toast.error( "Failed to load purchase orders")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.po_number.toLowerCase().includes(search.toLowerCase()) ||
      order.supplier?.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Purchase Orders</h1>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Order
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
            <TabsTrigger value="shipped">Shipped</TabsTrigger>
            <TabsTrigger value="received">Received</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No purchase orders found</p>
            <Button variant="outline" className="mt-4 bg-transparent" onClick={() => setCreateDialogOpen(true)}>
              Create your first order
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const status = statusConfig[order.status]
            const StatusIcon = status.icon
            const itemCount = order.items?.length || 0
            const totalQuantity = order.items?.reduce((sum, item) => sum + item.quantity_ordered, 0) || 0

            return (
              <Card
                key={order.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => setSelectedOrder(order)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <StatusIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{order.po_number}</span>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.supplier?.name || "No supplier"} • {itemCount} items ({totalQuantity} units)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(order.total_amount)}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <CreatePurchaseOrderDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} onSuccess={loadOrders} />

      {selectedOrder && (
        <PurchaseOrderDetailDialog
          open={!!selectedOrder}
          onOpenChange={(open) => !open && setSelectedOrder(null)}
          order={selectedOrder}
          onUpdate={loadOrders}
        />
      )}
    </div>
  )
}
