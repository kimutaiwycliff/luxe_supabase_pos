import { PageHeader } from "@/components/layout/page-header"
import { InventoryContent } from "@/components/inventory/inventory-content"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default function InventoryPage() {
  return (
    <>
      <PageHeader title="Inventory" breadcrumbs={[{ label: "Inventory" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Suspense fallback={<InventoryLoadingSkeleton />}>
          <InventoryContent />
        </Suspense>
      </div>
    </>
  )
}

function InventoryLoadingSkeleton() {
  return (
    <div>
      <div className="mb-6 flex gap-4">
        <Skeleton className="h-10 flex-1 max-w-sm" />
        <Skeleton className="h-10 w-40" />
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}
