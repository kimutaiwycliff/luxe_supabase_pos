import { Suspense } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { SuppliersContent } from "@/components/suppliers/suppliers-content"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Suppliers | Luxe Collections",
  description: "Manage your suppliers and vendors",
}

function SuppliersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export default function SuppliersPage() {
  return (
    <>
      <PageHeader
        title="Suppliers"
        breadcrumbs={[{ label: "Operations", href: "/suppliers" }, { label: "Suppliers" }]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Suspense fallback={<SuppliersSkeleton />}>
          <SuppliersContent />
        </Suspense>
      </div>
    </>
  )
}
