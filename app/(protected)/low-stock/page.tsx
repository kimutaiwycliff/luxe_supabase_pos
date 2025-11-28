import { PageHeader } from "@/components/layout/page-header"
import { LowStockContent } from "@/components/low-stock/low-stock-content"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default function LowStockPage() {
  return (
    <>
      <PageHeader
        title="Low Stock Alerts"
        breadcrumbs={[{ label: "Inventory", href: "/inventory" }, { label: "Low Stock" }]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Suspense fallback={<LowStockLoadingSkeleton />}>
          <LowStockContent />
        </Suspense>
      </div>
    </>
  )
}

function LowStockLoadingSkeleton() {
  return (
    <div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}
