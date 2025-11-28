import { algoliasearch } from 'algoliasearch';
// This file should only be imported in server actions/components
export const algoliaClient = algoliasearch(process.env.ALGOLIA_APP_ID!, process.env.ALGOLIA_ADMIN_API_KEY!)

// Index names
export const ALGOLIA_INDEXES = {
  products: "products",
  customers: "customers",
  suppliers: "suppliers",
  inventory: "inventory",
} as const

// Product index type
export interface AlgoliaProduct {
  objectID: string
  name: string
  description?: string
  sku: string
  barcode: string
  category_id?: string
  category_name?: string
  supplier_id?: string
  supplier_name?: string
  cost_price: number
  selling_price: number
  tags?: string[]
  is_active: boolean
  has_variants: boolean
  image_url?: string
  created_at: string
  updated_at: string
}

// Customer index type
export interface AlgoliaCustomer {
  objectID: string
  first_name: string
  last_name: string
  full_name: string
  email?: string
  phone?: string
  city?: string
  total_orders: number
  total_spent: number
  loyalty_points: number
  is_active: boolean
  created_at: string
}

// Supplier index type
export interface AlgoliaSupplier {
  objectID: string
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  payment_terms?: string
  lead_time_days?: number
  is_active: boolean
  created_at: string
}

// Inventory index type (for searching products with stock info)
export interface AlgoliaInventory {
  objectID: string
  product_id: string
  product_name: string
  product_sku: string
  product_barcode: string
  variant_id?: string
  variant_sku?: string
  variant_options?: Record<string, string>
  location_id: string
  location_name: string
  quantity: number
  reserved_quantity: number
  reorder_point: number
  is_low_stock: boolean
}
