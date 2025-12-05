import { Suspense } from "react"
import { LayawaysContent } from "@/components/layaways/layaways-content"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Layaway Orders | Luxe Collections POS",
  description: "Manage layaway orders and reservations",
}

export default function LayawaysPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Layaway Orders</h1>
        <p className="text-muted-foreground">Manage reserved products and pending payments</p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <LayawaysContent />
      </Suspense>
    </div>
  )
}
