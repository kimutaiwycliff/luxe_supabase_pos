"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
import { formatCurrency, formatRelativeTime } from "@/lib/format"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

interface RecentOrder {
  id: string
  order_number: string
  total_amount: number
  status: string
  payment_status: string
  created_at: string
  customer: { first_name: string; last_name: string } | null
  items: { id: string }[]
  payments: { payment_method: string; amount: number }[]
}

interface RecentOrdersTableProps {
  orders: RecentOrder[]
}

function getPaymentDisplay(payments: { payment_method: string; amount: number }[] | undefined) {
  if (!payments || payments.length === 0) return { type: "-", isSplit: false, details: [] }

  if (payments.length === 1) {
    const method = payments[0].payment_method
    return {
      type: method.charAt(0).toUpperCase() + method.slice(1),
      isSplit: false,
      details: [],
    }
  }

  // Multiple payments = split payment
  const details = payments.map((p) => ({
    method: p.payment_method.charAt(0).toUpperCase() + p.payment_method.slice(1),
    amount: p.amount,
  }))

  return { type: "Split", isSplit: true, details }
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
      return customer ? `${customer.first_name} ${customer.last_name}` : "Walk-in Customer"
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
      const { type, isSplit, details } = getPaymentDisplay(row.original.payments)

      if (!isSplit) {
        return <span>{type}</span>
      }

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="cursor-help">
                {type}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                {details.map((d, i) => (
                  <div key={i} className="flex justify-between gap-4 text-xs">
                    <span>{d.method}:</span>
                    <span className="font-medium">{formatCurrency(d.amount)}</span>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
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
