"use client"

import useSWR from "swr"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
import { AlertTriangle, Package, Truck } from "lucide-react"
import { getLowStockItems } from "@/lib/actions/inventory"
import { formatNumber } from "@/lib/format"
import type { Inventory } from "@/lib/types"

export function LowStockContent() {
  const { data, isLoading } = useSWR("low-stock", async () => {
    const result = await getLowStockItems()
    return result
  })

  const searchParams = useSearchParams()
  const statusFilter = searchParams.get("status")

  const items = (data?.items || []).filter((item) => {
    if (statusFilter === "out-of-stock") {
      return item.quantity === 0
    }
    return true
  })

  const columns: ColumnDef<Inventory>[] = [
    {
      accessorKey: "product.name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
      cell: ({ row }) => {
        const item = row.original
        const product = item.product
        const variant = item.variant
        return (
          <div>
            <p className="font-medium">{product?.name || "Unknown"}</p>
            {variant && (
              <p className="text-xs text-muted-foreground">{Object.values(variant.option_values).join(" / ")}</p>
            )}
          </div>
        )
      },
    },
    {
      id: "sku",
      header: ({ column }) => <DataTableColumnHeader column={column} title="SKU" />,
      accessorFn: (row) => row.variant?.sku || row.product?.sku,
      cell: ({ row }) => {
        const item = row.original
        return <span className="font-mono text-sm">{item.variant?.sku || item.product?.sku}</span>
      },
    },
    {
      accessorKey: "location.name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Location" />,
      cell: ({ row }) => row.original.location?.name,
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Current" className="justify-center" />,
      cell: ({ row }) => {
        const item = row.original
        const isOutOfStock = item.quantity === 0
        return (
          <span className={`text-center block font-semibold ${isOutOfStock ? "text-destructive" : "text-warning"}`}>
            {formatNumber(item.quantity)}
          </span>
        )
      },
      meta: { className: "text-center" },
    },
    {
      accessorKey: "product.low_stock_threshold",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Threshold" className="justify-center" />,
      cell: ({ row }) => {
        const threshold = row.original.product?.low_stock_threshold || 0
        return (
          <div className="text-center text-muted-foreground">{formatNumber(threshold)}</div>
        )
      },
      meta: { className: "text-center" },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const isOutOfStock = row.original.quantity === 0
        return <StatusBadge status={isOutOfStock ? "out" : "low"} />
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const item = row.original
        return (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/suppliers?reorder=${item.product?.id}`}>
              <Truck className="mr-2 h-4 w-4" />
              Reorder
            </Link>
          </Button>
        )
      },
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
          <p className="mt-4 text-lg font-medium text-foreground">All products are well stocked</p>
          <p className="text-sm text-muted-foreground">No items are below their reorder threshold</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-2xl font-semibold text-foreground">{items.filter((i) => i.quantity === 0).length}</p>
              <p className="text-sm text-muted-foreground">Out of Stock</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-warning" />
            <div>
              <p className="text-2xl font-semibold text-foreground">{items.filter((i) => i.quantity > 0).length}</p>
              <p className="text-sm text-muted-foreground">Low Stock</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Truck className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-semibold text-foreground">{items.length}</p>
              <p className="text-sm text-muted-foreground">Total Alerts</p>
            </div>
          </div>
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
  )
}
