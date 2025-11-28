import { PageHeader } from "@/components/layout/page-header"
import { ProductsContent } from "@/components/products/products-content"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProductsPage() {
  return (
    <>
      <PageHeader title="Products" breadcrumbs={[{ label: "Products" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Suspense fallback={<ProductsLoadingSkeleton />}>
          <ProductsContent />
        </Suspense>
      </div>
    </>
  )
}

function ProductsLoadingSkeleton() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
