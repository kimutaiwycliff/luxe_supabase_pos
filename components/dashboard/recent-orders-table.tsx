"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
import { formatCurrency, formatRelativeTime } from "@/lib/format"

interface RecentOrder {
  id: string
  orderNumber: string
  customer: string
  items: number
  total: number
  paymentMethod: string
  status: "completed" | "pending" | "cancelled"
  createdAt: string
}

// Demo data
const recentOrders: RecentOrder[] = [
  {
    id: "1",
    orderNumber: "ORD-2024-0156",
    customer: "Jane Muthoni",
    items: 3,
    total: 8500,
    paymentMethod: "M-Pesa",
    status: "completed",
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "2",
    orderNumber: "ORD-2024-0155",
    customer: "Walk-in Customer",
    items: 1,
    total: 2300,
    paymentMethod: "Cash",
    status: "completed",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "3",
    orderNumber: "ORD-2024-0154",
    customer: "Peter Kamau",
    items: 5,
    total: 15600,
    paymentMethod: "M-Pesa",
    status: "completed",
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: "4",
    orderNumber: "ORD-2024-0153",
    customer: "Mary Wanjiku",
    items: 2,
    total: 4200,
    paymentMethod: "Card",
    status: "pending",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "5",
    orderNumber: "ORD-2024-0152",
    customer: "John Ochieng",
    items: 4,
    total: 12800,
    paymentMethod: "M-Pesa",
    status: "completed",
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
]

const columns: ColumnDef<RecentOrder>[] = [
  {
    accessorKey: "orderNumber",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Order" />,
    cell: ({ row }) => <span className="font-medium">{row.getValue("orderNumber")}</span>,
  },
  {
    accessorKey: "customer",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
  },
  {
    accessorKey: "items",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Items" className="justify-center" />,
    cell: ({ row }) => <div className="text-center">{row.getValue("items")}</div>,
    meta: { className: "text-center" },
  },
  {
    accessorKey: "paymentMethod",
    header: "Payment",
  },
  {
    accessorKey: "total",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total" className="justify-end" />,
    cell: ({ row }) => <div className="text-right font-medium">{formatCurrency(row.getValue("total"))}</div>,
    meta: { className: "text-right" },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Time" className="justify-end" />,
    cell: ({ row }) => (
      <div className="text-right text-muted-foreground">{formatRelativeTime(row.getValue("createdAt"))}</div>
    ),
    meta: { className: "text-right" },
  },
]

export function RecentOrdersTable() {
  return (
    <DataTable
      columns={columns}
      data={recentOrders}
      showSearch={false}
      showColumnToggle={false}
      showPagination={false}
      emptyMessage="No recent orders"
    />
  )
}
