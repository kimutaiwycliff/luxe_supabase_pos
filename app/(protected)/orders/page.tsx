import { PageHeader } from "@/components/layout/page-header"
import { OrdersContent } from "@/components/orders/orders-content"

export const metadata = { title: "Orders" }

export default function OrdersPage() {
  return (
    <>
      <PageHeader
        title="Orders"
        breadcrumbs={[{ label: "Orders", href: "/orders" }]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <OrdersContent />
      </div>
    </>
  )
}
