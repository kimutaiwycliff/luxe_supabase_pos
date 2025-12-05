"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import { Search, Plus, Minus, DollarSign, TrendingUp, AlertTriangle, PackageX, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/ui/status-badge"
import { StatCard } from "@/components/ui/stat-card"
import { getLocations, getInventoryInsights, getAllInventory } from "@/lib/actions/inventory"
import { AdjustStockDialog } from "./adjust-stock-dialog"
import { formatCurrency, formatNumber } from "@/lib/format"
import type { Inventory } from "@/lib/types"

export function InventoryContent() {
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null)
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove">("add")

  // Fetch locations
  const { data: locationsData } = useSWR("locations", async () => {
    return await getLocations()
  })

  // Fetch inventory insights
  const {
    data: insightsData,
    isLoading: insightsLoading,
    mutate: mutateInsights,
  } = useSWR(["inventory-insights", locationFilter], async () => {
    return await getInventoryInsights(locationFilter)
  })

  // Fetch all inventory from Supabase
  const {
    data: inventoryData,
    isLoading: inventoryLoading,
    mutate: mutateInventory,
  } = useSWR(["all-inventory", locationFilter], async () => {
    return await getAllInventory(locationFilter)
  })

  const locations = locationsData?.locations || []
  const inventory = inventoryData?.inventory || []
  const insights = insightsData || {
    totalItems: 0,
    totalUnits: 0,
    totalStockValue: 0,
    totalPotentialRevenue: 0,
    totalPotentialProfit: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  }

  // Filter inventory based on search query
  const filteredInventory = useMemo(() => {
    if (!searchQuery.trim()) return inventory

    const query = searchQuery.toLowerCase()
    return inventory.filter((item) => {
      const productName = item.product?.name?.toLowerCase() || ""
      const productSku = item.product?.sku?.toLowerCase() || ""
      const variantSku = item.variant?.sku?.toLowerCase() || ""
      const locationName = item.location?.name?.toLowerCase() || ""

      return (
        productName.includes(query) ||
        productSku.includes(query) ||
        variantSku.includes(query) ||
        locationName.includes(query)
      )
    })
  }, [inventory, searchQuery])

  const getStockStatus = (item: Inventory): "out" | "low" | "active" => {
    if (item.quantity <= 0) return "out"
    const threshold = item.product?.low_stock_threshold || 10
    if (item.quantity <= threshold) return "low"
    return "active"
  }

  const handleAdjustStock = async (item: Inventory, type: "add" | "remove") => {
    setSelectedItem(item)
    setAdjustmentType(type)
    setAdjustDialogOpen(true)
  }

  const handleRefresh = () => {
    mutateInsights()
    mutateInventory()
  }

  const handleAdjustSuccess = () => {
    setAdjustDialogOpen(false)
    handleRefresh()
  }

  return (
    <div className="space-y-6">
      {/* Insight Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {insightsLoading ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Total Stock Value"
              value={formatCurrency(insights.totalStockValue)}
              icon={DollarSign}
              className="text-blue-500"
            />
            <StatCard
              title="Potential Revenue"
              value={formatCurrency(insights.totalPotentialRevenue)}
              className="text-green-500"
              icon={TrendingUp}
            />
            <StatCard
              title="Potential Profit"
              value={formatCurrency(insights.totalPotentialProfit)}
              className="text-emerald-500"
              icon={TrendingUp}
            />
            <StatCard
              title="Stock Alerts"
              value={formatNumber(insights.lowStockCount + insights.outOfStockCount)}
              className="text-amber-500"
              icon={AlertTriangle}
            />
          </>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

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
        </div>

        <Button variant="outline" size="icon" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Inventory Table */}
      {inventoryLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border">
          <PackageX className="h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium text-foreground">No inventory found</p>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? "Try adjusting your search" : "Add products to start tracking inventory"}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left text-sm font-medium">Product</th>
                <th className="p-3 text-left text-sm font-medium">SKU</th>
                <th className="p-3 text-left text-sm font-medium">Location</th>
                <th className="p-3 text-center text-sm font-medium">In Stock</th>
                <th className="p-3 text-center text-sm font-medium">Reserved</th>
                <th className="p-3 text-center text-sm font-medium">Available</th>
                <th className="p-3 text-right text-sm font-medium">Value</th>
                <th className="p-3 text-left text-sm font-medium">Status</th>
                <th className="p-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => {
                const status = getStockStatus(item)
                const available = item.quantity - (item.reserved_quantity || 0)
                const costPrice = item.variant?.cost_price || item.product?.cost_price || 0
                const stockValue = item.quantity * costPrice

                return (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{item.product?.name}</p>
                        {item.variant?.option_values && (
                          <p className="text-xs text-muted-foreground">
                            {typeof item.variant.option_values === "object"
                              ? Object.values(item.variant.option_values).join(" / ")
                              : item.variant.option_values}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-sm">{item.variant?.sku || item.product?.sku}</span>
                    </td>
                    <td className="p-3 text-sm">{item.location?.name}</td>
                    <td className="p-3 text-center font-medium">{formatNumber(item.quantity)}</td>
                    <td className="p-3 text-center text-muted-foreground">
                      {formatNumber(item.reserved_quantity || 0)}
                    </td>
                    <td className="p-3 text-center font-medium">{formatNumber(available)}</td>
                    <td className="p-3 text-right text-sm">{formatCurrency(stockValue)}</td>
                    <td className="p-3">
                      <StatusBadge status={status} />
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent"
                          onClick={() => handleAdjustStock(item, "add")}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent"
                          onClick={() => handleAdjustStock(item, "remove")}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <AdjustStockDialog
        open={adjustDialogOpen}
        onOpenChange={setAdjustDialogOpen}
        item={selectedItem}
        type={adjustmentType}
        onSuccess={handleAdjustSuccess}
      />
    </div>
  )
}
