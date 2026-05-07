"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleEdit = async (algoliaSupplier: AlgoliaSupplier) => {
    const result = await getSupplierById(algoliaSupplier.objectID)
    if (result.supplier) {
      setSelectedSupplier(result.supplier as Supplier)
      setDialogOpen(true)
    }
  }

  const handleDeleteRequest = (id: string, name: string) => {
    setDeleteTarget({ id, name })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteSupplier(deleteTarget.id)
      await deleteSupplierFromIndex(deleteTarget.id)
      toast.success("Supplier deleted")
      setRefreshKey((k) => k + 1)
    } catch {
      toast.error("Failed to delete supplier. They may have associated products.")
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <AlgoliaSearchBox placeholder="Search suppliers..." className="flex-1 sm:max-w-sm" />
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              setSelectedSupplier(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        </div>

        <SupplierHits onEdit={handleEdit} onDelete={handleDeleteRequest} />
      </AlgoliaProvider>

      <SupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplier={selectedSupplier}
        onSuccess={handleSuccess}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This supplier will be permanently removed. Products linked to them will lose their supplier reference.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
