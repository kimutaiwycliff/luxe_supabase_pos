"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SupplierDialog } from "./supplier-dialog"
import { deleteSupplier, getSupplierById } from "@/lib/actions/suppliers"
import { deleteSupplierFromIndex } from "@/lib/actions/algolia"
import { toast } from "sonner"
import type { AlgoliaSupplier } from "@/lib/algolia"
import { AlgoliaProvider } from "@/components/search/algolia-provider"
import { AlgoliaSearchBox } from "@/components/search/algolia-search-box"
import { SupplierHits } from "@/components/search/supplier-hits"
import { ALGOLIA_INDEXES } from "@/lib/algolia-client"

interface Supplier {
  id: string
  name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
  payment_terms: string | null
  lead_time_days: number | null
  is_active: boolean
  products: { count: number }[]
}

export function SuppliersContent() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleEdit = async (algoliaSupplier: AlgoliaSupplier) => {
    // Fetch full supplier data from Supabase
    const result = await getSupplierById(algoliaSupplier.objectID)
    if (result.supplier) {
      setSelectedSupplier(result.supplier as Supplier)
      setDialogOpen(true)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this supplier?")) return

    try {
      await deleteSupplier(id)
      await deleteSupplierFromIndex(id)
      toast.success("Supplier deleted")
      setRefreshKey((k) => k + 1)
    } catch (error) {
      console.error("Failed to delete supplier:", error)
      toast.error("Failed to delete supplier. They may have associated products.")
      toast.error("Failed to delete supplier. They may have associated products.")
    }
  }

  const handleSuccess = () => {
    setRefreshKey((k) => k + 1)
    setDialogOpen(false)
    setSelectedSupplier(null)
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <AlgoliaProvider key={refreshKey} indexName={ALGOLIA_INDEXES.suppliers} hitsPerPage={50}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <AlgoliaSearchBox placeholder="Search suppliers..." className="max-w-sm" />
          <Button
            onClick={() => {
              setSelectedSupplier(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        </div>

        <SupplierHits onEdit={handleEdit} onDelete={handleDelete} />
      </AlgoliaProvider>

      <SupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplier={selectedSupplier}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
