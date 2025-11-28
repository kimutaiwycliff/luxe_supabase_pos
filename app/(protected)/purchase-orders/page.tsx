import { Suspense } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { PurchaseOrdersContent } from "@/components/purchase-orders/purchase-orders-content"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Purchase Orders | Boutique Store",
  description: "Manage purchase orders and restock inventory",
}

function PurchaseOrdersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export default function PurchaseOrdersPage() {
  return (
    <>
      <PageHeader
        title="Purchase Orders"
        breadcrumbs={[{ label: "Operations", href: "/purchase-orders" }, { label: "Purchase Orders" }]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Suspense fallback={<PurchaseOrdersSkeleton />}>
          <PurchaseOrdersContent />
        </Suspense>
      </div>
    </>
  )
}
