import { PageHeader } from "@/components/layout/page-header"
import { AnalyticsContent } from "@/components/analytics/analytics-content"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader title="Analytics" breadcrumbs={[{ label: "Reports", href: "/analytics" }, { label: "Analytics" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Suspense fallback={<AnalyticsLoadingSkeleton />}>
          <AnalyticsContent />
        </Suspense>
      </div>
    </>
  )
}

function AnalyticsLoadingSkeleton() {
  return (
    <div>
      <div className="mb-6 flex gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  )
}
