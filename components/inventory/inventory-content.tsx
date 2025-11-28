"use client"

import { useState } from "react"
import useSWR from "swr"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge } from "@/components/ui/status-badge"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
import { Plus, Minus, Package } from "lucide-react"
import { getInventory, getLocations } from "@/lib/actions/inventory"
import { formatCurrency, formatNumber } from "@/lib/format"
import { AdjustStockDialog } from "./adjust-stock-dialog"
import type { Inventory } from "@/lib/types"

export function InventoryContent() {
  const [search, ] = useState("")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null)
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove">("add")

  const {
    data: inventoryData,
    isLoading: inventoryLoading,
    mutate,
  } = useSWR(["inventory", search, locationFilter], async () => {
    const result = await getInventory({
      search: search || undefined,
      location_id: locationFilter !== "all" ? locationFilter : undefined,
    })
    return result
  })

  const { data: locationsData } = useSWR("locations", async () => {
    const result = await getLocations()
    return result
  })

  const inventory = inventoryData?.inventory || []
  const locations = locationsData?.locations || []

  const handleAdjustStock = (item: Inventory, type: "add" | "remove") => {
    setSelectedItem(item)
    setAdjustmentType(type)
    setAdjustDialogOpen(true)
  }

  const getStockStatus = (item: Inventory): "out" | "low" | "active" => {
    if (item.quantity <= 0) return "out"
    if (item.quantity <= item.reorder_point) return "low"
    return "active"
  }

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
      header: ({ column }) => <DataTableColumnHeader column={column} title="In Stock" className="justify-center" />,
      cell: ({ row }) => <div className="text-center font-medium">{formatNumber(row.getValue("quantity"))}</div>,
      meta: { className: "text-center" },
    },
    {
      accessorKey: "reserved_quantity",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Reserved" className="justify-center" />,
      cell: ({ row }) => (
        <div className="text-center text-muted-foreground">{formatNumber(row.getValue("reserved_quantity"))}</div>
      ),
      meta: { className: "text-center" },
    },
    {
      id: "available",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Available" className="justify-center" />,
      accessorFn: (row) => row.quantity - row.reserved_quantity,
      cell: ({ row }) => {
        const available = row.getValue("available") as number
        return <div className="text-center font-medium">{formatNumber(available)}</div>
      },
      meta: { className: "text-center" },
    },
    {
      id: "value",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Value" className="justify-end" />,
      accessorFn: (row) => (row.product?.cost_price || 0) * row.quantity,
      cell: ({ row }) => {
        const value = row.getValue("value") as number
        return <div className="text-right">{formatCurrency(value)}</div>
      },
      meta: { className: "text-right" },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = getStockStatus(row.original)
        return <StatusBadge status={status} />
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex justify-end gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-transparent"
              onClick={(e) => {
                e.stopPropagation()
                handleAdjustStock(item, "add")
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-transparent"
              onClick={(e) => {
                e.stopPropagation()
                handleAdjustStock(item, "remove")
              }}
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>
        )
      },
      enableSorting: false,
      enableHiding: false,
      meta: { className: "text-right" },
    },
  ]

  return (
    <div className="p-6">
      <DataTable
        columns={columns}
        data={inventory}
        isLoading={inventoryLoading}
        searchPlaceholder="Search inventory..."
        emptyMessage="No inventory found"
        emptyDescription="Add products and stock to see inventory here"
        emptyIcon={<Package className="h-10 w-10 text-muted-foreground" />}
        pageSize={20}
        toolbar={
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <AdjustStockDialog
        open={adjustDialogOpen}
        onOpenChange={setAdjustDialogOpen}
        item={selectedItem}
        type={adjustmentType}
        onSuccess={() => {
          mutate()
          setAdjustDialogOpen(false)
        }}
      />
    </div>
  )
}
