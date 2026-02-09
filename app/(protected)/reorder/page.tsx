import { Suspense } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { ReorderContentEnhanced } from "@/components/reorder/reorder-content-enhanced"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Smart Reorder | Luxe Collections",
  description: "AI-powered inventory reordering and optimization",
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
        title="Smart Reorder"
        breadcrumbs={[{ label: "Inventory", href: "/inventory" }, { label: "Smart Reorder" }]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Suspense fallback={<ReorderSkeleton />}>
          <ReorderContentEnhanced />
        </Suspense>
      </div>
    </>
  )
}
