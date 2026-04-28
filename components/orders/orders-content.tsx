"use client"

import { useState, useTransition } from "react"
import useSWR from "swr"
import type { ColumnDef } from "@tanstack/react-table"
import { Globe, Store, Truck, Package, Pencil, MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/ui/status-badge"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getOrders, updateOrderTracking } from "@/lib/actions/orders"
import { formatCurrency, formatRelativeTime } from "@/lib/format"
import { OrderStatusDialog } from "@/components/orders/order-status-dialog"
import { OrderDetailSheet } from "@/components/orders/order-detail-sheet"
import type { Order } from "@/lib/types"

type TabValue = "all" | "pos" | "online"

function OnlineBadge() {
  return (
    <Badge variant="outline" className="gap-1 text-xs border-blue-500/40 text-blue-600 bg-blue-500/5">
      <Globe className="h-3 w-3" />
      Online
    </Badge>
  )
}

function TrackingCell({ order, onSave }: { order: Order; onSave: (orderId: string, tracking: string) => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(order.tracking_number ?? "")
  const [pending, startTransition] = useTransition()

  if (order.source !== "webshop" || order.delivery_method !== "delivery") return null

  const handleSave = () => {
    startTransition(async () => {
      await onSave(order.id, value)
      setOpen(false)
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {order.tracking_number ? (
          <span className="font-mono text-xs">{order.tracking_number}</span>
        ) : (
          <span className="italic text-xs">Add tracking</span>
        )}
        <Pencil className="h-3 w-3 flex-shrink-0" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tracking Number — {order.order_number}</DialogTitle>
          </DialogHeader>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. TRK-123456"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function OrdersContent() {
  const [tab, setTab] = useState<TabValue>("all")
  const [statusDialogOrder, setStatusDialogOrder] = useState<Order | null>(null)
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)

  const source = tab === "all" ? undefined : tab === "online" ? "webshop" : "pos"

  const { data, isLoading, mutate } = useSWR(
    ["orders", tab],
    () => getOrders({ source, limit: 100 }),
    { revalidateOnFocus: false }
  )

  const orders = data?.orders ?? []

  const handleSaveTracking = async (orderId: string, trackingNumber: string) => {
    await updateOrderTracking(orderId, trackingNumber)
    mutate()
  }

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "order_number",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Order" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.getValue("order_number")}</span>
          {row.original.source === "webshop" && <OnlineBadge />}
        </div>
      ),
    },
    {
      id: "customer",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
      cell: ({ row }) => {
        const o = row.original
        if (o.source === "webshop") {
          return (
            <div className="text-sm">
              <div>{o.customer_email ?? "—"}</div>
              {o.shipping_address && (
                <div className="text-muted-foreground text-xs">
                  {o.shipping_address.firstName} {o.shipping_address.lastName}
                </div>
              )}
            </div>
          )
        }
        const c = o.customer
        return c ? `${c.first_name} ${c.last_name}` : "Walk-in"
      },
    },
    {
      id: "delivery",
      header: "Delivery",
      cell: ({ row }) => {
        const o = row.original
        if (o.source !== "webshop") return <span className="text-muted-foreground text-xs">—</span>
        return (
          <div className="flex items-center gap-1.5 text-sm">
            {o.delivery_method === "delivery" ? (
              <><Truck className="h-3.5 w-3.5 text-muted-foreground" /><span>Delivery</span></>
            ) : (
              <><Store className="h-3.5 w-3.5 text-muted-foreground" /><span>Pickup</span></>
            )}
          </div>
        )
      },
    },
    {
      id: "tracking",
      header: "Tracking",
      cell: ({ row }) => (
        <TrackingCell order={row.original} onSave={handleSaveTracking} />
      ),
    },
    {
      id: "items",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Items" className="justify-center" />,
      cell: ({ row }) => (
        <div className="text-center">{row.original.items?.length ?? 0}</div>
      ),
    },
    {
      accessorKey: "total_amount",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Total" />,
      cell: ({ row }) => formatCurrency(row.getValue("total_amount")),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    {
      accessorKey: "payment_status",
      header: "Payment",
      cell: ({ row }) => <StatusBadge status={row.getValue("payment_status")} />,
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {formatRelativeTime(row.getValue("created_at"))}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStatusDialogOrder(row.original)}>
                Update status
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  const onlineCount = orders.filter((o) => o.source === "webshop").length

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList>
          <TabsTrigger value="all">
            All Orders
          </TabsTrigger>
          <TabsTrigger value="pos" className="gap-1.5">
            <Store className="h-3.5 w-3.5" />
            POS
          </TabsTrigger>
          <TabsTrigger value="online" className="gap-1.5">
            <Package className="h-3.5 w-3.5" />
            Online
            {tab === "all" && onlineCount > 0 && (
              <span className="ml-1 rounded-full bg-blue-500/15 text-blue-600 text-xs px-1.5 py-0.5 leading-none">
                {onlineCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        columns={columns}
        data={orders}
        isLoading={isLoading}
        searchColumn="order_number"
        searchPlaceholder="Search by order number…"
        onRowClick={(order) => setDetailOrder(order)}
      />

      {statusDialogOrder && (
        <OrderStatusDialog
          order={statusDialogOrder}
          open={!!statusDialogOrder}
          onOpenChange={(open) => { if (!open) setStatusDialogOrder(null) }}
          onSuccess={() => mutate()}
        />
      )}

      <OrderDetailSheet
        order={detailOrder}
        open={!!detailOrder}
        onOpenChange={(open) => { if (!open) setDetailOrder(null) }}
      />
    </div>
  )
}
