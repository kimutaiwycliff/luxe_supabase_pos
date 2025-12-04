import { Suspense } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { CustomersContent } from "@/components/customers/customers-content"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Customers | Luxe Collections",
  description: "Manage your customer database",
}

function CustomersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}

export default function CustomersPage() {
  return (
    <>
      <PageHeader
        title="Customers"
        breadcrumbs={[{ label: "Operations", href: "/customers" }, { label: "Customers" }]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Suspense fallback={<CustomersSkeleton />}>
          <CustomersContent />
        </Suspense>
      </div>
    </>
  )
}
