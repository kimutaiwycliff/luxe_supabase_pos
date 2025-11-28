"use server"

import { algoliaClient, ALGOLIA_INDEXES } from "./algolia"
import type { AlgoliaProduct, AlgoliaCustomer, AlgoliaSupplier, AlgoliaInventory } from "./algolia"

// ============================================
// Product Search (Server Action)
// ============================================

export async function searchProducts(
  query: string,
  options?: {
    categoryId?: string
    isActive?: boolean
    limit?: number
  },
) {
  const index = algoliaClient.initIndex(ALGOLIA_INDEXES.products)

  const filters: string[] = []
  if (options?.categoryId) {
    filters.push(`category_id:${options.categoryId}`)
  }
  if (options?.isActive !== undefined) {
    filters.push(`is_active:${options.isActive}`)
  }

  const { hits, nbHits } = await index.search<AlgoliaProduct>(query, {
    hitsPerPage: options?.limit || 50,
    filters: filters.length > 0 ? filters.join(" AND ") : undefined,
  })

  return {
    products: hits,
    count: nbHits,
  }
}

export async function searchProductsForPOS(query: string, categoryId?: string) {
  const index = algoliaClient.initIndex(ALGOLIA_INDEXES.products)

  const filters = ["is_active:true"]
  if (categoryId) {
    filters.push(`category_id:${categoryId}`)
  }

  const { hits } = await index.search<AlgoliaProduct>(query, {
    hitsPerPage: 50,
    filters: filters.join(" AND "),
  })

  return hits
}

// ============================================
// Customer Search (Server Action)
// ============================================

export async function searchCustomers(
  query: string,
  options?: {
    isActive?: boolean
    limit?: number
  },
) {
  const index = algoliaClient.initIndex(ALGOLIA_INDEXES.customers)

  const filters: string[] = []
  if (options?.isActive !== undefined) {
    filters.push(`is_active:${options.isActive}`)
  }

  const { hits, nbHits } = await index.search<AlgoliaCustomer>(query, {
    hitsPerPage: options?.limit || 20,
    filters: filters.length > 0 ? filters.join(" AND ") : undefined,
  })

  return {
    customers: hits,
    count: nbHits,
  }
}

// ============================================
// Supplier Search (Server Action)
// ============================================

export async function searchSuppliers(
  query: string,
  options?: {
    isActive?: boolean
    limit?: number
  },
) {
  const index = algoliaClient.initIndex(ALGOLIA_INDEXES.suppliers)

  const filters: string[] = []
  if (options?.isActive !== undefined) {
    filters.push(`is_active:${options.isActive}`)
  }

  const { hits, nbHits } = await index.search<AlgoliaSupplier>(query, {
    hitsPerPage: options?.limit || 50,
    filters: filters.length > 0 ? filters.join(" AND ") : undefined,
  })

  return {
    suppliers: hits,
    count: nbHits,
  }
}

// ============================================
// Inventory Search (Server Action)
// ============================================

export async function searchInventory(
  query: string,
  options?: {
    locationId?: string
    lowStockOnly?: boolean
    limit?: number
  },
) {
  const index = algoliaClient.initIndex(ALGOLIA_INDEXES.inventory)

  const filters: string[] = []
  if (options?.locationId) {
    filters.push(`location_id:${options.locationId}`)
  }
  if (options?.lowStockOnly) {
    filters.push(`is_low_stock:true`)
  }

  const { hits, nbHits } = await index.search<AlgoliaInventory>(query, {
    hitsPerPage: options?.limit || 100,
    filters: filters.length > 0 ? filters.join(" AND ") : undefined,
  })

  return {
    inventory: hits,
    count: nbHits,
  }
}
