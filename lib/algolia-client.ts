import { liteClient as algoliasearch } from "algoliasearch/lite"

// Client-side Algolia client using search-only API key
export const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!,
)

// Index names (same as server-side)
export const ALGOLIA_INDEXES = {
  products: "products",
  customers: "customers",
  suppliers: "suppliers",
  inventory: "inventory",
} as const
