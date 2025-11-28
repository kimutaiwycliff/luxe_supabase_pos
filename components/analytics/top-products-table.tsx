"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
import { formatCurrency, formatNumber } from "@/lib/format"
import type { TopProduct } from "@/app/actions/analytics"

interface TopProductsTableProps {
  products: TopProduct[]
  isLoading?: boolean
}

const columns: ColumnDef<TopProduct>[] = [
  {
    id: "rank",
    header: "#",
    cell: ({ row }) => <span className="text-muted-foreground">{row.index + 1}</span>,
    enableSorting: false,
    meta: { className: "w-8" },
  },
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
    cell: ({ row }) => {
      const product = row.original
      return (
        <div>
          <p className="font-medium truncate max-w-[150px]">{product.name}</p>
          <p className="text-xs text-muted-foreground">{product.sku}</p>
        </div>
      )
    },
  },
  {
    accessorKey: "quantity_sold",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Qty" className="justify-end" />,
    cell: ({ row }) => <div className="text-right">{formatNumber(row.getValue("quantity_sold"))}</div>,
    meta: { className: "text-right" },
  },
  {
    accessorKey: "revenue",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Revenue" className="justify-end" />,
    cell: ({ row }) => <div className="text-right font-medium">{formatCurrency(row.getValue("revenue"))}</div>,
    meta: { className: "text-right" },
  },
  {
    accessorKey: "profit",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Profit" className="justify-end" />,
    cell: ({ row }) => {
      const product = row.original
      const margin = product.revenue > 0 ? ((product.profit / product.revenue) * 100).toFixed(0) : "0"
      return (
        <div className="text-right">
          <span className="text-success">{formatCurrency(product.profit)}</span>
          <span className="ml-1 text-xs text-muted-foreground">({margin}%)</span>
        </div>
      )
    },
    meta: { className: "text-right" },
  },
]

export function TopProductsTable({ products, isLoading }: TopProductsTableProps) {
  return (
    <div className="max-h-[350px] overflow-auto">
      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        showSearch={false}
        showColumnToggle={false}
        showPagination={false}
        emptyMessage="No sales data available"
      />
    </div>
  )
}
