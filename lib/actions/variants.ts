"use server"

import { getSupabaseServer } from "@/lib/supabase/server"
import { revalidateTag } from "next/cache"

export interface ProductVariant {
  id: string
  product_id: string
  sku: string
  barcode: string
  name: string | null
  cost_price: number | null
  selling_price: number | null
  compare_at_price: number | null
  tax_rate: number | null
  weight: number | null
  image_path: string | null
  is_active: boolean
  option_values: Record<string, string> | null
  inventory?: {
    id: string
    quantity: number
    reserved_quantity: number
    location_id: string
  }
}

export async function getProductVariants(
  productId: string,
): Promise<{ variants: ProductVariant[]; error: string | null }> {
  const supabase = await getSupabaseServer()

  const { data, error } = await supabase
    .from("product_variants")
    .select(`
      *,
      inventory(id, quantity, reserved_quantity, location_id)
    `)
    .eq("product_id", productId)
    .order("sort_order")

  if (error) {
    return { variants: [], error: error.message }
  }

  // Flatten inventory to single object (assuming single location)
  const variants = data.map((v) => ({
    ...v,
    inventory: Array.isArray(v.inventory) && v.inventory.length > 0 ? v.inventory[0] : undefined,
  }))

  return { variants, error: null }
}

export async function updateVariant(
  variantId: string,
  data: {
    cost_price?: number
    selling_price?: number
    compare_at_price?: number
    tax_rate?: number | null
    is_active?: boolean
  },
): Promise<{ error: string | null }> {
  const supabase = await getSupabaseServer()

  const { error } = await supabase
    .from("product_variants")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", variantId)

  if (error) {
    return { error: error.message }
  }

  ; (revalidateTag as any)("products", "max")
    ; (revalidateTag as any)("inventory", "max")

  return { error: null }
}

export async function updateVariantInventory(
  variantId: string,
  locationId: string,
  quantity: number,
  reason?: string,
): Promise<{ error: string | null }> {
  const supabase = await getSupabaseServer()

  // Get current inventory
  const { data: inventory, error: fetchError } = await supabase
    .from("inventory")
    .select("id, quantity, product_id")
    .eq("variant_id", variantId)
    .eq("location_id", locationId)
    .single()

  if (fetchError && fetchError.code !== "PGRST116") {
    return { error: fetchError.message }
  }

  // Get variant's product_id
  const { data: variant } = await supabase.from("product_variants").select("product_id").eq("id", variantId).single()

  if (!variant) {
    return { error: "Variant not found" }
  }

  if (inventory) {
    // Update existing inventory
    const diff = quantity - inventory.quantity

    const { error: updateError } = await supabase
      .from("inventory")
      .update({
        quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", inventory.id)

    if (updateError) {
      return { error: updateError.message }
    }

    // Record stock movement
    if (diff !== 0) {
      await supabase.from("stock_movements").insert({
        product_id: variant.product_id,
        variant_id: variantId,
        location_id: locationId,
        movement_type: diff > 0 ? "adjustment_in" : "adjustment_out",
        quantity: diff,
        reason: reason || "Manual adjustment",
        reference_type: "manual",
      })
    }
  } else {
    // Create new inventory record
    const { error: insertError } = await supabase.from("inventory").insert({
      product_id: variant.product_id,
      variant_id: variantId,
      location_id: locationId,
      quantity,
    })

    if (insertError) {
      return { error: insertError.message }
    }

    // Record stock movement
    if (quantity > 0) {
      await supabase.from("stock_movements").insert({
        product_id: variant.product_id,
        variant_id: variantId,
        location_id: locationId,
        movement_type: "initial",
        quantity,
        reason: reason || "Initial stock",
        reference_type: "manual",
      })
    }
  }

  ; (revalidateTag as any)("inventory", "max")

  return { error: null }
}

export async function createVariant(
  productId: string,
  data: {
    name: string
    sku?: string
    cost_price: number
    selling_price: number
    compare_at_price?: number
    tax_rate?: number | null
    option_values?: Record<string, string>
    is_active?: boolean
  },
): Promise<{ variant: ProductVariant | null; error: string | null }> {
  const supabase = await getSupabaseServer()

  // Get product info for SKU generation
  const { data: product } = await supabase.from("products").select("sku").eq("id", productId).single()

  const basesku = product?.sku || "VAR"
  const timestamp = Date.now().toString(36).toUpperCase()
  const generatedSku = data.sku || `${basesku}-${timestamp}`
  const generatedBarcode = `${Date.now()}${Math.random().toString().slice(2, 6)}`

  const { data: variant, error } = await supabase
    .from("product_variants")
    .insert({
      product_id: productId,
      name: data.name,
      sku: generatedSku,
      barcode: generatedBarcode,
      cost_price: data.cost_price,
      selling_price: data.selling_price,
      compare_at_price: data.compare_at_price,
      tax_rate: data.tax_rate,
      option_values: data.option_values,
      is_active: data.is_active ?? true,
    })
    .select()
    .single()

  if (error) {
    return { variant: null, error: error.message }
  }

  ; (revalidateTag as any)("products", "max")

  return { variant, error: null }
}

export async function deleteVariant(variantId: string): Promise<{ error: string | null }> {
  const supabase = await getSupabaseServer()

  const { error } = await supabase.from("product_variants").delete().eq("id", variantId)

  if (error) {
    return { error: error.message }
  }

  ; (revalidateTag as any)("products", "max")
    ; (revalidateTag as any)("inventory", "max")

  return { error: null }
}
