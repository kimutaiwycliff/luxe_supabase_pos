"use server"

import { SearchResponse } from "algoliasearch"
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
  const filters: string[] = []
  if (options?.categoryId) {
    filters.push(`category_id:${options.categoryId}`)
  }
  if (options?.isActive !== undefined) {
    filters.push(`is_active:${options.isActive}`)
  }

  const { results } = await algoliaClient.search({
    requests: [
      {
        indexName: ALGOLIA_INDEXES.products,
        query,
        hitsPerPage: options?.limit || 50,
        filters: filters.length > 0 ? filters.join(" AND ") : undefined,
      },
    ],
  })

  const result = results[0] as SearchResponse<AlgoliaProduct>

  return {
    products: result.hits,
    count: result.nbHits,
  }
}

export async function searchProductsForPOS(query: string, categoryId?: string) {
  const filters = ["is_active:true"]
  if (categoryId) {
    filters.push(`category_id:${categoryId}`)
  }

  const { results } = await algoliaClient.search({
    requests: [
      {
        indexName: ALGOLIA_INDEXES.products,
        query,
        hitsPerPage: 50,
        filters: filters.join(" AND "),
      },
    ],
  })

  const result = results[0] as SearchResponse<AlgoliaProduct>
  return result.hits
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
  const filters: string[] = []
  if (options?.isActive !== undefined) {
    filters.push(`is_active:${options.isActive}`)
  }

  const { results } = await algoliaClient.search({
    requests: [
      {
        indexName: ALGOLIA_INDEXES.customers,
        query,
        hitsPerPage: options?.limit || 20,
        filters: filters.length > 0 ? filters.join(" AND ") : undefined,
      },
    ],
  })

  const result = results[0] as SearchResponse<AlgoliaCustomer>

  return {
    customers: result.hits,
    count: result.nbHits,
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
  const filters: string[] = []
  if (options?.isActive !== undefined) {
    filters.push(`is_active:${options.isActive}`)
  }

  const { results } = await algoliaClient.search({
    requests: [
      {
        indexName: ALGOLIA_INDEXES.suppliers,
        query,
        hitsPerPage: options?.limit || 50,
        filters: filters.length > 0 ? filters.join(" AND ") : undefined,
      },
    ],
  })

  const result = results[0] as SearchResponse<AlgoliaSupplier>

  return {
    suppliers: result.hits,
    count: result.nbHits,
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
  const filters: string[] = []
  if (options?.locationId) {
    filters.push(`location_id:${options.locationId}`)
  }
  if (options?.lowStockOnly) {
    filters.push(`is_low_stock:true`)
  }

  const { results } = await algoliaClient.search({
    requests: [
      {
        indexName: ALGOLIA_INDEXES.inventory,
        query,
        hitsPerPage: options?.limit || 100,
        filters: filters.length > 0 ? filters.join(" AND ") : undefined,
      },
    ],
  })

  const result = results[0] as SearchResponse<AlgoliaInventory>

  return {
    inventory: result.hits,
    count: result.nbHits,
  }
}
