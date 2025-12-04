"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
import { formatCurrency, formatRelativeTime } from "@/lib/format"

interface RecentOrder {
  id: string
  order_number: string
  total_amount: number
  status: string
  payment_status: string
  created_at: string
  customer: { first_name: string; last_name: string } | null
  items: { id: string }[]
  payments: { payment_method: string }[]
}

interface RecentOrdersTableProps {
  orders: RecentOrder[]
}

const columns: ColumnDef<RecentOrder>[] = [
  {
    accessorKey: "order_number",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Order" />,
    cell: ({ row }) => <span className="font-medium">{row.getValue("order_number")}</span>,
  },
  {
    id: "customer",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
    cell: ({ row }) => {
      const customer = row.original.customer
      if (customer) {
        return `${customer?.first_name} ${customer?.last_name}`
      }
      return "Walk-in Customer"
    },
  },
  {
    id: "items",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Items" className="justify-center" />,
    cell: ({ row }) => <div className="text-center">{row.original.items?.length || 0}</div>,
    meta: { className: "text-center" },
  },
  {
    id: "paymentMethod",
    header: "Payment",
    cell: ({ row }) => {
      const payments = row.original.payments
      if (!payments || payments.length === 0) return "-"
      const method = payments[0].payment_method
      return method.charAt(0).toUpperCase() + method.slice(1)
    },
  },
  {
    accessorKey: "total_amount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total" className="justify-end" />,
    cell: ({ row }) => (
      <div className="text-right font-medium">{formatCurrency(row.getValue("total_amount") || 0)}</div>
    ),
    meta: { className: "text-right" },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Time" className="justify-end" />,
    cell: ({ row }) => (
      <div className="text-right text-muted-foreground">{formatRelativeTime(row.getValue("created_at"))}</div>
    ),
    meta: { className: "text-right" },
  },
]

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  return (
    <DataTable
      columns={columns}
      data={orders}
      showSearch={false}
      showColumnToggle={false}
      showPagination={false}
      emptyMessage="No recent orders"
    />
  )
}
