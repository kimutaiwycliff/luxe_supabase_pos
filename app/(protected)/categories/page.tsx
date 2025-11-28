import { PageHeader } from "@/components/layout/page-header"
import { CategoriesContent } from "@/components/categories/categories-content"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default function CategoriesPage() {
  return (
    <>
      <PageHeader title="Categories" breadcrumbs={[{ label: "Categories" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Suspense fallback={<CategoriesLoadingSkeleton />}>
          <CategoriesContent />
        </Suspense>
      </div>
    </>
  )
}

function CategoriesLoadingSkeleton() {
  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
