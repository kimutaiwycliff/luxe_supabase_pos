import { CollectionsContent } from "@/components/collections/collections-content"
import { getCollections } from "@/lib/actions/collections"

export const metadata = { title: "Collections" }

export default async function CollectionsPage() {
  const { collections } = await getCollections()
  return <CollectionsContent initialCollections={collections} />
}
