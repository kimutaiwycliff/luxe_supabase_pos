import { RestockContent } from "@/components/restock/restock-content"

export const metadata = { title: "Restock List" }

export default function RestockPage() {
  return (
    <div className="p-4 sm:p-6">
      <RestockContent />
    </div>
  )
}
