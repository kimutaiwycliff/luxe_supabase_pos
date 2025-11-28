"use server"

import { algoliaClient, ALGOLIA_INDEXES } from "@/lib/algolia"
import type { AlgoliaProduct, AlgoliaCustomer, AlgoliaSupplier, AlgoliaInventory } from "@/lib/algolia"
import { getSupabaseServer } from "@/lib/supabase/server"

// ============================================
// Product Indexing
// ============================================

export async function indexProduct(product: {
  id: string
  name: string
  description?: string | null
  sku: string
  barcode: string
  category_id?: string | null
  supplier_id?: string | null
  cost_price: number
  selling_price: number
  tags?: string[] | null
  is_active: boolean
  has_variants: boolean
  image_url?: string | null
  created_at: string
  updated_at: string
  category?: { name: string } | null
  supplier?: { name: string } | null
}) {
  const index = algoliaClient.initIndex(ALGOLIA_INDEXES.products)

  const algoliaProduct: AlgoliaProduct = {
    objectID: product.id,
    name: product.name,
    description: product.description || undefined,
    sku: product.sku,
    barcode: product.barcode,
    category_id: product.category_id || undefined,
    category_name: product.category?.name || undefined,
    supplier_id: product.supplier_id || undefined,
    supplier_name: product.supplier?.name || undefined,
    cost_price: product.cost_price,
    selling_price: product.selling_price,
    tags: product.tags || undefined,
    is_active: product.is_active,
    has_variants: product.has_variants,
    image_url: product.image_url || undefined,
    created_at: product.created_at,
    updated_at: product.updated_at,
  }

  await index.saveObject(algoliaProduct)
}

export async function deleteProductFromIndex(productId: string) {
  const index = algoliaClient.initIndex(ALGOLIA_INDEXES.products)
  await index.deleteObject(productId)
}

// ============================================
// Customer Indexing
// ============================================

export async function indexCustomer(customer: {
  id: string
  first_name: string
  last_name: string
  email?: string | null
  phone?: string | null
  city?: string | null
  total_orders: number
  total_spent: number
  loyalty_points: number
  is_active: boolean
  created_at: string
}) {
  const index = algoliaClient.initIndex(ALGOLIA_INDEXES.customers)

  const algoliaCustomer: AlgoliaCustomer = {
    objectID: customer.id,
    first_name: customer.first_name,
    last_name: customer.last_name,
    full_name: `${customer.first_name} ${customer.last_name}`,
    email: customer.email || undefined,
    phone: customer.phone || undefined,
    city: customer.city || undefined,
    total_orders: customer.total_orders,
    total_spent: customer.total_spent,
    loyalty_points: customer.loyalty_points,
    is_active: customer.is_active,
    created_at: customer.created_at,
  }

  await index.saveObject(algoliaCustomer)
}

export async function deleteCustomerFromIndex(customerId: string) {
  const index = algoliaClient.initIndex(ALGOLIA_INDEXES.customers)
  await index.deleteObject(customerId)
}

// ============================================
// Supplier Indexing
// ============================================

export async function indexSupplier(supplier: {
  id: string
  name: string
  contact_person?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  payment_terms?: string | null
  lead_time_days?: number | null
  is_active: boolean
  created_at: string
}) {
  const index = algoliaClient.initIndex(ALGOLIA_INDEXES.suppliers)

  const algoliaSupplier: AlgoliaSupplier = {
    objectID: supplier.id,
    name: supplier.name,
    contact_person: supplier.contact_person || undefined,
    email: supplier.email || undefined,
    phone: supplier.phone || undefined,
    address: supplier.address || undefined,
    payment_terms: supplier.payment_terms || undefined,
    lead_time_days: supplier.lead_time_days || undefined,
    is_active: supplier.is_active,
    created_at: supplier.created_at,
  }

  await index.saveObject(algoliaSupplier)
}

export async function deleteSupplierFromIndex(supplierId: string) {
  const index = algoliaClient.initIndex(ALGOLIA_INDEXES.suppliers)
  await index.deleteObject(supplierId)
}

// ============================================
// Inventory Indexing
// ============================================

export async function indexInventoryItem(item: {
  id: string
  product_id: string
  variant_id?: string | null
  location_id: string
  quantity: number
  reserved_quantity: number
  reorder_point: number
  product?: {
    name: string
    sku: string
    barcode: string
    low_stock_threshold: number
  } | null
  variant?: {
    sku: string
    option_values: Record<string, string>
  } | null
  location?: {
    name: string
  } | null
}) {
  const index = algoliaClient.initIndex(ALGOLIA_INDEXES.inventory)

  const algoliaInventory: AlgoliaInventory = {
    objectID: item.id,
    product_id: item.product_id,
    product_name: item.product?.name || "",
    product_sku: item.product?.sku || "",
    product_barcode: item.product?.barcode || "",
    variant_id: item.variant_id || undefined,
    variant_sku: item.variant?.sku || undefined,
    variant_options: item.variant?.option_values || undefined,
    location_id: item.location_id,
    location_name: item.location?.name || "",
    quantity: item.quantity,
    reserved_quantity: item.reserved_quantity,
    reorder_point: item.reorder_point,
    is_low_stock: item.quantity <= item.reorder_point,
  }

  await index.saveObject(algoliaInventory)
}

// ============================================
// Bulk Sync Functions
// ============================================

export async function syncAllProductsToAlgolia() {
  const supabase = await getSupabaseServer()
  const index = algoliaClient.initIndex(ALGOLIA_INDEXES.products)

  const { data: products, error } = await supabase.from("products").select(`
      *,
      category:categories(name),
      supplier:suppliers(name)
    `)

  if (error) {
    console.error("Error fetching products for sync:", error)
    return { success: false, error: error.message, count: 0 }
  }

  const algoliaProducts: AlgoliaProduct[] = products.map((p) => ({
    objectID: p.id,
    name: p.name,
    description: p.description || undefined,
    sku: p.sku,
    barcode: p.barcode,
    category_id: p.category_id || undefined,
    category_name: p.category?.name || undefined,
    supplier_id: p.supplier_id || undefined,
    supplier_name: p.supplier?.name || undefined,
    cost_price: p.cost_price,
    selling_price: p.selling_price,
    tags: p.tags || undefined,
    is_active: p.is_active,
    has_variants: p.has_variants,
    image_url: p.image_url || undefined,
    created_at: p.created_at,
    updated_at: p.updated_at,
  }))

  await index.saveObjects(algoliaProducts)

  return { success: true, error: null, count: algoliaProducts.length }
}

export async function syncAllCustomersToAlgolia() {
  const supabase = await getSupabaseServer()
  const index = algoliaClient.initIndex(ALGOLIA_INDEXES.customers)

  const { data: customers, error } = await supabase.from("customers").select("*")

  if (error) {
    console.error("Error fetching customers for sync:", error)
    return { success: false, error: error.message, count: 0 }
  }

  const algoliaCustomers: AlgoliaCustomer[] = customers.map((c) => ({
    objectID: c.id,
    first_name: c.first_name,
    last_name: c.last_name,
    full_name: `${c.first_name} ${c.last_name}`,
    email: c.email || undefined,
    phone: c.phone || undefined,
    city: c.city || undefined,
    total_orders: c.total_orders,
    total_spent: c.total_spent,
    loyalty_points: c.loyalty_points,
    is_active: c.is_active,
    created_at: c.created_at,
  }))

  await index.saveObjects(algoliaCustomers)

  return { success: true, error: null, count: algoliaCustomers.length }
}

export async function syncAllSuppliersToAlgolia() {
  const supabase = await getSupabaseServer()
  const index = algoliaClient.initIndex(ALGOLIA_INDEXES.suppliers)

  const { data: suppliers, error } = await supabase.from("suppliers").select("*")

  if (error) {
    console.error("Error fetching suppliers for sync:", error)
    return { success: false, error: error.message, count: 0 }
  }

  const algoliaSuppliers: AlgoliaSupplier[] = suppliers.map((s) => ({
    objectID: s.id,
    name: s.name,
    contact_person: s.contact_person || undefined,
    email: s.email || undefined,
    phone: s.phone || undefined,
    address: s.address || undefined,
    payment_terms: s.payment_terms || undefined,
    lead_time_days: s.lead_time_days || undefined,
    is_active: s.is_active,
    created_at: s.created_at,
  }))

  await index.saveObjects(algoliaSuppliers)

  return { success: true, error: null, count: algoliaSuppliers.length }
}

export async function syncAllInventoryToAlgolia() {
  const supabase = await getSupabaseServer()
  const index = algoliaClient.initIndex(ALGOLIA_INDEXES.inventory)

  const { data: inventory, error } = await supabase.from("inventory").select(`
      *,
      product:products(name, sku, barcode, low_stock_threshold),
      variant:product_variants(sku, option_values),
      location:locations(name)
    `)

  if (error) {
    console.error("Error fetching inventory for sync:", error)
    return { success: false, error: error.message, count: 0 }
  }

  const algoliaInventory: AlgoliaInventory[] = inventory.map((i) => ({
    objectID: i.id,
    product_id: i.product_id,
    product_name: i.product?.name || "",
    product_sku: i.product?.sku || "",
    product_barcode: i.product?.barcode || "",
    variant_id: i.variant_id || undefined,
    variant_sku: i.variant?.sku || undefined,
    variant_options: i.variant?.option_values || undefined,
    location_id: i.location_id,
    location_name: i.location?.name || "",
    quantity: i.quantity,
    reserved_quantity: i.reserved_quantity,
    reorder_point: i.reorder_point,
    is_low_stock: i.quantity <= i.reorder_point,
  }))

  await index.saveObjects(algoliaInventory)

  return { success: true, error: null, count: algoliaInventory.length }
}

export async function syncAllToAlgolia() {
  const [products, customers, suppliers, inventory] = await Promise.all([
    syncAllProductsToAlgolia(),
    syncAllCustomersToAlgolia(),
    syncAllSuppliersToAlgolia(),
    syncAllInventoryToAlgolia(),
  ])

  return {
    products,
    customers,
    suppliers,
    inventory,
  }
}

// ============================================
// Configure Algolia Indexes
// ============================================

export async function configureAlgoliaIndexes() {
  // Products index settings
  const productsIndex = algoliaClient.initIndex(ALGOLIA_INDEXES.products)
  await productsIndex.setSettings({
    searchableAttributes: ["name", "sku", "barcode", "description", "category_name", "supplier_name", "tags"],
    attributesForFaceting: [
      "filterOnly(category_id)",
      "filterOnly(supplier_id)",
      "filterOnly(is_active)",
      "filterOnly(has_variants)",
      "searchable(category_name)",
      "searchable(tags)",
    ],
    customRanking: ["desc(updated_at)"],
    typoTolerance: true,
    minWordSizefor1Typo: 3,
    minWordSizefor2Typos: 6,
  })

  // Customers index settings
  const customersIndex = algoliaClient.initIndex(ALGOLIA_INDEXES.customers)
  await customersIndex.setSettings({
    searchableAttributes: ["full_name", "first_name", "last_name", "phone", "email", "city"],
    attributesForFaceting: ["filterOnly(is_active)", "searchable(city)"],
    customRanking: ["desc(total_spent)", "desc(total_orders)"],
  })

  // Suppliers index settings
  const suppliersIndex = algoliaClient.initIndex(ALGOLIA_INDEXES.suppliers)
  await suppliersIndex.setSettings({
    searchableAttributes: ["name", "contact_person", "email", "phone", "address"],
    attributesForFaceting: ["filterOnly(is_active)"],
    customRanking: ["asc(name)"],
  })

  // Inventory index settings
  const inventoryIndex = algoliaClient.initIndex(ALGOLIA_INDEXES.inventory)
  await inventoryIndex.setSettings({
    searchableAttributes: ["product_name", "product_sku", "product_barcode", "variant_sku", "location_name"],
    attributesForFaceting: ["filterOnly(location_id)", "filterOnly(product_id)", "filterOnly(is_low_stock)"],
    customRanking: ["asc(quantity)"],
  })

  return { success: true }
}
