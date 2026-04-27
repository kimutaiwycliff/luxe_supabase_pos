"use client"

import { useState } from "react"
import useSWR from "swr"
import { useSearchParams } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
import { AlertTriangle, Package, Truck, ShoppingCart } from "lucide-react"
import { getLowStockItems } from "@/lib/actions/inventory"
import { formatNumber, formatCurrency } from "@/lib/format"
import { CreatePurchaseOrderDialog } from "@/components/purchase-orders/create-purchase-order-dialog"
import { toast } from "sonner"
import type { Inventory } from "@/lib/types"

interface RestockTarget {
  supplierId?: string
  items: { product_id: string; product_name: string; sku: string; quantity: number; unit_cost: number }[]
}

export function LowStockContent() {
  const { data, isLoading } = useSWR("low-stock", () => getLowStockItems())
  const searchParams = useSearchParams()
  const statusFilter = searchParams.get("status")
  const [restockTarget, setRestockTarget] = useState<RestockTarget | null>(null)

  const items = (data?.items || []).filter((item) =>
    statusFilter === "out-of-stock" ? item.quantity === 0 : true,
  )

  const openRestock = (item: Inventory) => {
    const product = item.product
    if (!product) return
    setRestockTarget({
      supplierId: product.supplier_id ?? undefined,
      items: [{
        product_id: product.id,
        product_name: product.name,
        sku: item.variant?.sku ?? product.sku,
        quantity: Math.max(product.low_stock_threshold ?? 10, 10),
        unit_cost: item.variant?.cost_price ?? product.cost_price ?? 0,
      }],
    })
  }

  // Group by supplier for bulk PO creation
  const restockAll = () => {
    if (items.length === 0) return
    const lineItems = items.map((item) => ({
      product_id: item.product!.id,
      product_name: item.product!.name,
      sku: item.variant?.sku ?? item.product!.sku,
      quantity: Math.max(item.product!.low_stock_threshold ?? 10, 10),
      unit_cost: item.variant?.cost_price ?? item.product!.cost_price ?? 0,
    }))
    const firstSupplierId = items.find((i) => i.product?.supplier_id)?.product?.supplier_id ?? undefined
    setRestockTarget({ supplierId: firstSupplierId, items: lineItems })
  }

  const columns: ColumnDef<Inventory>[] = [
    {
      accessorKey: "product.name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
      cell: ({ row }) => {
        const item = row.original
        const isOutOfStock = item.quantity === 0
        return (
          <div>
            <p className="font-medium">{item.product?.name || "Unknown"}</p>
            {item.variant && (
              <p className="text-xs text-muted-foreground">{Object.values(item.variant.option_values ?? {}).join(" / ") || item.variant.name}</p>
            )}
            {isOutOfStock && <Badge variant="destructive" className="text-[10px] mt-0.5">Out of stock</Badge>}
          </div>
        )
      },
    },
    {
      id: "sku",
      header: ({ column }) => <DataTableColumnHeader column={column} title="SKU" />,
      accessorFn: (row) => row.variant?.sku || row.product?.sku,
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.variant?.sku || row.original.product?.sku}</span>
      ),
    },
    {
      id: "supplier",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Supplier" />,
      accessorFn: (row) => (row.product as any)?.supplier?.name,
      cell: ({ row }) => {
        const supplierName = (row.original.product as any)?.supplier?.name
        const costPrice = row.original.variant?.cost_price ?? row.original.product?.cost_price
        return (
          <div>
            <p className="text-sm">{supplierName || <span className="text-muted-foreground italic">No supplier</span>}</p>
            {costPrice != null && <p className="text-xs text-muted-foreground">Cost: {formatCurrency(costPrice)}</p>}
          </div>
        )
      },
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Stock" className="justify-center" />,
      cell: ({ row }) => {
        const item = row.original
        const isOut = item.quantity === 0
        return (
          <div className="text-center">
            <span className={`font-semibold ${isOut ? "text-destructive" : "text-amber-600"}`}>{formatNumber(item.quantity)}</span>
            <span className="text-muted-foreground text-xs"> / {formatNumber(item.product?.low_stock_threshold ?? 0)}</span>
          </div>
        )
      },
      meta: { className: "text-center" },
    },
    {
      accessorKey: "location.name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Location" />,
      cell: ({ row }) => <span className="text-sm">{row.original.location?.name}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button size="sm" onClick={() => openRestock(row.original)}>
          <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
          Restock
        </Button>
      ),
      enableSorting: false,
      enableHiding: false,
      meta: { className: "text-right" },
    },
  ]

  if (items.length === 0 && !isLoading) {
    return (
      <div className="p-6">
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border">
          <Package className="h-10 w-10 text-success" />
          <p className="mt-4 text-lg font-medium">All products are well stocked</p>
          <p className="text-sm text-muted-foreground">No items are below their reorder threshold</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="p-4 sm:p-6">
        {/* Summary Cards */}
        <div className="mb-6 grid gap-4 grid-cols-1 sm:grid-cols-3">
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-semibold">{items.filter((i) => i.quantity === 0).length}</p>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/10 p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-amber-600" />
              <div>
                <p className="text-2xl font-semibold">{items.filter((i) => i.quantity > 0).length}</p>
                <p className="text-sm text-muted-foreground">Low Stock</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-semibold">{items.length}</p>
                <p className="text-sm text-muted-foreground">Total Alerts</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={restockAll}>
              <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
              Create PO for all
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          searchPlaceholder="Search low stock items..."
          emptyMessage="No low stock items"
          pageSize={20}
        />
      </div>

      <CreatePurchaseOrderDialog
        open={!!restockTarget}
        onOpenChange={(v) => { if (!v) setRestockTarget(null) }}
        onSuccess={() => { setRestockTarget(null); toast.success("Purchase order created") }}
        initialSupplierId={restockTarget?.supplierId}
        initialItems={restockTarget?.items}
      />
    </>
  )
}
