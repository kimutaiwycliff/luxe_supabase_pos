"use client"

import { useState } from "react"
import useSWR from "swr"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getLocations, getInventoryItemById } from "@/lib/actions/inventory"
import { AdjustStockDialog } from "./adjust-stock-dialog"
import type { Inventory } from "@/lib/types"
import type { AlgoliaInventory } from "@/lib/algolia"
import { AlgoliaProvider } from "@/components/search/algolia-provider"
import { AlgoliaSearchBox } from "@/components/search/algolia-search-box"
import { InventoryHits } from "@/components/search/inventory-hits"
import { AlgoliaPagination } from "@/components/search/algolia-pagination"
import { ALGOLIA_INDEXES } from "@/lib/algolia-client"

export function InventoryContent() {
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null)
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove">("add")
  const [refreshKey, setRefreshKey] = useState(0)

  const { data: locationsData } = useSWR("locations", async () => {
    const result = await getLocations()
    return result
  })

  const locations = locationsData?.locations || []

  // Build Algolia filters
  const buildFilters = () => {
    const filters: string[] = []
    if (locationFilter !== "all") {
      filters.push(`location_id:${locationFilter}`)
    }
    return filters.join(" AND ")
  }

  const handleAdjustStock = async (algoliaItem: AlgoliaInventory, type: "add" | "remove") => {
    // Fetch full inventory item from Supabase
    const result = await getInventoryItemById(algoliaItem.objectID)
    if (result.item) {
      setSelectedItem(result.item)
      setAdjustmentType(type)
      setAdjustDialogOpen(true)
    }
  }

  return (
    <div className="p-6">
      <AlgoliaProvider key={refreshKey} indexName={ALGOLIA_INDEXES.inventory} filters={buildFilters()} hitsPerPage={20}>
        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <AlgoliaSearchBox placeholder="Search inventory..." className="flex-1 max-w-sm" />

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
        </div>

        {/* Inventory Table */}
        <InventoryHits onAdjustStock={handleAdjustStock} />

        {/* Pagination */}
        <AlgoliaPagination />
      </AlgoliaProvider>

      <AdjustStockDialog
        open={adjustDialogOpen}
        onOpenChange={setAdjustDialogOpen}
        item={selectedItem}
        type={adjustmentType}
        onSuccess={() => {
          setRefreshKey((k) => k + 1)
          setAdjustDialogOpen(false)
        }}
      />
    </div>
  )
}
