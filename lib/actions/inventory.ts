"use server"

import { getSupabaseServer } from "@/lib/supabase/server"
import { revalidateTag } from "next/cache"
import type { Inventory, Location } from "@/lib/types"
import { searchInventory as algoliaSearchInventory } from "@/lib/algolia-search"
import { indexInventoryItem } from "./algolia"

export async function getInventory(options?: {
  location_id?: string
  low_stock_only?: boolean
  search?: string
  limit?: number
  offset?: number
}) {
  const supabase = await getSupabaseServer()

  const selectQuery = `
    *,
    product:products(id, name, sku, barcode, image_url, selling_price, cost_price, low_stock_threshold),
    variant:product_variants(id, sku, barcode, option_values, image_path, selling_price, cost_price),
    location:locations(id, name)
  `

  if (options?.search && options.search.trim().length > 0) {
    try {
      const { inventory: algoliaHits } = await algoliaSearchInventory(options.search, {
        locationId: options.location_id,
        lowStockOnly: options.low_stock_only,
        limit: options.limit || 100,
      })

      if (algoliaHits.length > 0) {
        const inventoryIds = algoliaHits.map((i) => i.objectID)
        const { data, error, count } = await supabase
          .from("inventory")
          .select(selectQuery, { count: "exact" })
          .in("id", inventoryIds)

        if (error) {
          console.error("Error fetching inventory:", error)
          return { inventory: [], count: 0, error: error.message }
        }

        // Maintain Algolia's relevance ordering
        const sortedInventory = inventoryIds.map((id) => data?.find((i) => i.id === id)).filter(Boolean) as Inventory[]

        return { inventory: sortedInventory, count: count || 0, error: null }
      }

      return { inventory: [], count: 0, error: null }
    } catch (err) {
      console.error("Algolia inventory search error:", err)
      return fallbackInventorySearch(options)
    }
  }

  // Standard query without search
  let query = supabase
    .from("inventory")
    .select(selectQuery, { count: "exact" })
    .order("updated_at", { ascending: false })

  if (options?.location_id) {
    query = query.eq("location_id", options.location_id)
  }

  if (options?.low_stock_only) {
    query = query.lte("quantity", supabase.rpc("get_reorder_point"))
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error, count } = await query

  if (error) {
    console.error("Error fetching inventory:", error)
    return { inventory: [], count: 0, error: error.message }
  }

  return { inventory: data as Inventory[], count: count || 0, error: null }
}

async function fallbackInventorySearch(options?: {
  location_id?: string
  search?: string
  limit?: number
  offset?: number
}) {
  const supabase = await getSupabaseServer()

  const selectQuery = `
    *,
    product:products(id, name, sku, barcode, image_url, selling_price, cost_price, low_stock_threshold),
    variant:product_variants(id, sku, barcode, option_values, image_path, selling_price, cost_price),
    location:locations(id, name)
  `

  let query = supabase
    .from("inventory")
    .select(selectQuery, { count: "exact" })
    .order("updated_at", { ascending: false })

  if (options?.location_id) {
    query = query.eq("location_id", options.location_id)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error, count } = await query

  if (error) {
    return { inventory: [], count: 0, error: error.message }
  }

  // Client-side filtering as last resort
  let filtered = data as Inventory[]
  if (options?.search) {
    const searchLower = options.search.toLowerCase()
    filtered = filtered.filter(
      (item) =>
        item.product?.name?.toLowerCase().includes(searchLower) ||
        item.product?.sku?.toLowerCase().includes(searchLower) ||
        item.variant?.sku?.toLowerCase().includes(searchLower),
    )
  }

  return { inventory: filtered, count: count || 0, error: null }
}

export async function getLowStockItems(locationId?: string) {
  const supabase = await getSupabaseServer()

  let query = supabase.from("inventory").select(`
      *,
      product:products(id, name, sku, barcode, image_url, selling_price, cost_price, low_stock_threshold, supplier_id),
      variant:product_variants(id, sku, barcode, option_values, image_path),
      location:locations(id, name)
    `)

  if (locationId) {
    query = query.eq("location_id", locationId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching low stock:", error)
    return { items: [], error: error.message }
  }

  const lowStock = (data || []).filter((item) => {
    const threshold = item.product?.low_stock_threshold || 0
    return item.quantity <= threshold
  })

  return { items: lowStock as Inventory[], error: null }
}

export async function adjustInventory(data: {
  product_id?: string
  variant_id?: string
  location_id: string
  quantity: number
  movement_type: "adjustment" | "damage" | "return"
  notes?: string
}) {
  const supabase = await getSupabaseServer()

  // Get current inventory
  let query = supabase.from("inventory").select("*").eq("location_id", data.location_id)

  if (data.variant_id) {
    query = query.eq("variant_id", data.variant_id)
  } else if (data.product_id) {
    query = query.eq("product_id", data.product_id).is("variant_id", null)
  }

  const { data: existing } = await query.single()

  let inventoryId: string | null = null

  if (existing) {
    // Update existing inventory
    const newQuantity = existing.quantity + data.quantity

    const { error } = await supabase
      .from("inventory")
      .update({
        quantity: Math.max(0, newQuantity),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)

    if (error) {
      return { success: false, error: error.message }
    }

    inventoryId = existing.id
  } else {
    // Create new inventory record
    const { data: newInventory, error } = await supabase
      .from("inventory")
      .insert({
        product_id: data.product_id || null,
        variant_id: data.variant_id || null,
        location_id: data.location_id,
        quantity: Math.max(0, data.quantity),
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    inventoryId = newInventory.id
  }

  // Record stock movement
  const { error: movementError } = await supabase.from("stock_movements").insert({
    product_id: data.product_id || null,
    variant_id: data.variant_id || null,
    location_id: data.location_id,
    movement_type: data.movement_type,
    quantity: data.quantity,
    notes: data.notes || null,
  })

  if (movementError) {
    console.error("Error recording movement:", movementError)
  }

  // Update Algolia index
  if (inventoryId) {
    try {
      const { data: updatedItem } = await supabase
        .from("inventory")
        .select(`
          *,
          product:products(name, sku, barcode, low_stock_threshold),
          variant:product_variants(sku, option_values),
          location:locations(name)
        `)
        .eq("id", inventoryId)
        .single()

      if (updatedItem) {
        await indexInventoryItem(updatedItem)
      }
    } catch (err) {
      console.error("Error updating inventory in Algolia:", err)
    }
  }

  revalidateTag("inventory", "max")
  return { success: true, error: null }
}

export async function getLocations() {
  const supabase = await getSupabaseServer()

  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("is_active", true)
    .order("is_default", { ascending: false })

  if (error) {
    return { locations: [], error: error.message }
  }

  return { locations: data as Location[], error: null }
}

export async function getStockMovements(options?: {
  product_id?: string
  variant_id?: string
  location_id?: string
  limit?: number
}) {
  const supabase = await getSupabaseServer()

  let query = supabase
    .from("stock_movements")
    .select(`
      *,
      product:products(id, name, sku),
      variant:product_variants(id, sku, option_values),
      location:locations(id, name)
    `)
    .order("created_at", { ascending: false })

  if (options?.product_id) {
    query = query.eq("product_id", options.product_id)
  }

  if (options?.variant_id) {
    query = query.eq("variant_id", options.variant_id)
  }

  if (options?.location_id) {
    query = query.eq("location_id", options.location_id)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    return { movements: [], error: error.message }
  }

  return { movements: data as any[], error: null }
}

export async function getInventoryItemById(id: string) {
  const supabase = await getSupabaseServer()

  const { data, error } = await supabase
    .from("inventory")
    .select(`
      *,
      product:products(id, name, sku, barcode, image_url, selling_price, cost_price, low_stock_threshold),
      variant:product_variants(id, sku, barcode, option_values, image_path, selling_price, cost_price),
      location:locations(id, name)
    `)
    .eq("id", id)
    .single()

  if (error) {
    return { item: null, error: error.message }
  }

  return { item: data as Inventory, error: null }
}

export async function getProductStock(productId: string, locationId: string) {
  const supabase = await getSupabaseServer()

  const { data, error } = await supabase
    .from("inventory")
    .select("quantity, reserved_quantity")
    .eq("product_id", productId)
    .eq("location_id", locationId)
    .is("variant_id", null)
    .single()

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching product stock:", error)
    return { quantity: 0, reserved_quantity: 0, available_quantity: 0, error: error.message }
  }

  const quantity = data?.quantity || 0
  const reserved = data?.reserved_quantity || 0

  return {
    quantity,
    reserved_quantity: reserved,
    available_quantity: quantity - reserved,
    error: null,
  }
}

export async function getVariantStock(variantId: string, locationId: string) {
  const supabase = await getSupabaseServer()

  const { data, error } = await supabase
    .from("inventory")
    .select("quantity, reserved_quantity")
    .eq("variant_id", variantId)
    .eq("location_id", locationId)
    .single()

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching variant stock:", error)
    return { quantity: 0, reserved_quantity: 0, available_quantity: 0, error: error.message }
  }

  const quantity = data?.quantity || 0
  const reserved = data?.reserved_quantity || 0

  return {
    quantity,
    reserved_quantity: reserved,
    available_quantity: quantity - reserved,
    error: null,
  }
}

export async function getInventoryInsights(locationId?: string) {
  const supabase = await getSupabaseServer()

  let query = supabase.from("inventory").select(`
    quantity,
    reserved_quantity,
    product:products(cost_price, selling_price),
    variant:product_variants(cost_price, selling_price)
  `)

  if (locationId && locationId !== "all") {
    query = query.eq("location_id", locationId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching inventory insights:", error)
    return {
      totalItems: 0,
      totalUnits: 0,
      totalStockValue: 0,
      totalPotentialRevenue: 0,
      totalPotentialProfit: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      error: error.message,
    }
  }

  let totalUnits = 0
  let totalStockValue = 0
  let totalPotentialRevenue = 0
  let lowStockCount = 0
  let outOfStockCount = 0

  for (const item of data || []) {
    const qty = item.quantity || 0
    const costPrice = item.variant?.cost_price || item.product?.cost_price || 0
    const sellingPrice = item.variant?.selling_price || item.product?.selling_price || 0

    totalUnits += qty
    totalStockValue += qty * costPrice
    totalPotentialRevenue += qty * sellingPrice

    if (qty <= 0) {
      outOfStockCount++
    } else if (qty <= 10) {
      // Consider low stock if <= 10 units
      lowStockCount++
    }
  }

  const totalPotentialProfit = totalPotentialRevenue - totalStockValue

  return {
    totalItems: data?.length || 0,
    totalUnits,
    totalStockValue,
    totalPotentialRevenue,
    totalPotentialProfit,
    lowStockCount,
    outOfStockCount,
    error: null,
  }
}

export async function getAllInventory(locationId?: string) {
  const supabase = await getSupabaseServer()

  const selectQuery = `
    *,
    product:products(id, name, sku, barcode, image_url, selling_price, cost_price, low_stock_threshold),
    variant:product_variants(id, sku, barcode, option_values, image_path, selling_price, cost_price),
    location:locations(id, name)
  `

  let query = supabase.from("inventory").select(selectQuery).order("updated_at", { ascending: false })

  if (locationId && locationId !== "all") {
    query = query.eq("location_id", locationId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching all inventory:", error)
    return { inventory: [], error: error.message }
  }

  return { inventory: data as Inventory[], error: null }
}
