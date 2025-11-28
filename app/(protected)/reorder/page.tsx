import { Suspense } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { ReorderContent } from "@/components/reorder/reorder-content"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Reorder Alerts | Boutique Store",
  description: "Low stock alerts and quick reordering",
}

function ReorderSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export default function ReorderPage() {
  return (
    <>
      <PageHeader
        title="Reorder Alerts"
        breadcrumbs={[{ label: "Inventory", href: "/inventory" }, { label: "Reorder Alerts" }]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Suspense fallback={<ReorderSkeleton />}>
          <ReorderContent />
        </Suspense>
      </div>
    </>
  )
}
