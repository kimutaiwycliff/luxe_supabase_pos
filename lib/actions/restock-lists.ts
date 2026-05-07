"use server"

import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getDefaultLocation } from "@/lib/actions/locations"
import { revalidateTag } from "next/cache"

export type RestockItemStatus = "pending" | "ordered" | "received"
export type RestockListStatus = "active" | "completed" | "cancelled"

export interface RestockListItem {
  id: string
  list_id: string
  product_id: string
  variant_id: string | null
  product_name: string
  variant_name: string | null
  sku: string
  supplier_id: string | null
  supplier_name: string | null
  qty_requested: number
  qty_received: number
  unit_cost: number
  status: RestockItemStatus
  notes: string | null
  sort_order: number
  created_at: string
}

export interface RestockList {
  id: string
  name: string
  status: RestockListStatus
  notes: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  items?: RestockListItem[]
}

// ── Queries ────────────────────────────────────────────────────────────────

export async function getActiveRestockList(): Promise<{ list: RestockList | null; error: string | null }> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("restock_lists")
    .select(`*, items:restock_list_items(*)`)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return { list: null, error: error.message }
  if (!data) return { list: null, error: null }

  const list = {
    ...data,
    items: (data.items as RestockListItem[]).sort((a, b) => {
      const order = { pending: 0, ordered: 1, received: 2 }
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]
      return (a.supplier_name ?? "").localeCompare(b.supplier_name ?? "")
    }),
  }
  return { list, error: null }
}

export async function getRestockLists(): Promise<{ lists: RestockList[]; error: string | null }> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("restock_lists")
    .select(`*, items:restock_list_items(id, status)`)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) return { lists: [], error: error.message }
  return { lists: (data as RestockList[]) ?? [], error: null }
}

export async function getArchivedRestockLists(): Promise<{ lists: RestockList[]; error: string | null }> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("restock_lists")
    .select(`*, items:restock_list_items(id, status, qty_requested, qty_received, unit_cost)`)
    .in("status", ["completed", "cancelled"])
    .order("completed_at", { ascending: false })
    .limit(30)

  if (error) return { lists: [], error: error.message }
  return { lists: (data as RestockList[]) ?? [], error: null }
}

export async function getRestockListById(listId: string): Promise<{ list: RestockList | null; error: string | null }> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("restock_lists")
    .select(`*, items:restock_list_items(*)`)
    .eq("id", listId)
    .single()

  if (error) return { list: null, error: error.message }
  const list = {
    ...data,
    items: ((data as any).items as RestockListItem[]).sort((a, b) =>
      (a.supplier_name ?? "").localeCompare(b.supplier_name ?? ""),
    ),
  }
  return { list: list as RestockList, error: null }
}

export async function bulkSetStatusForItems(
  itemIds: string[],
  status: RestockItemStatus,
): Promise<{ error: string | null }> {
  for (const id of itemIds) {
    const { error } = await setItemStatus(id, status)
    if (error) return { error }
  }
  return { error: null }
}

// ── Mutations ──────────────────────────────────────────────────────────────

export async function createRestockList(name = "Restock List"): Promise<{ list: RestockList | null; error: string | null }> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("restock_lists")
    .insert({ name, status: "active" })
    .select()
    .single()

  if (error) return { list: null, error: error.message }
  return { list: { ...data, items: [] } as RestockList, error: null }
}

export async function seedListFromLowStock(listId: string): Promise<{ added: number; error: string | null }> {
  const supabase = getSupabaseAdmin()

  // Get existing product_ids already in list
  const { data: existing } = await supabase
    .from("restock_list_items")
    .select("product_id")
    .eq("list_id", listId)
  const existingIds = new Set((existing ?? []).map((r: any) => r.product_id))

  // Fetch all active products with supplier and inventory
  const { data: products, error } = await supabase
    .from("products")
    .select(`
      id, name, sku, cost_price, low_stock_threshold, reorder_quantity,
      supplier:suppliers(id, name),
      inventory(quantity, reserved_quantity)
    `)
    .eq("is_active", true)
    .not("supplier_id", "is", null)

  if (error) return { added: 0, error: error.message }

  const toAdd: any[] = []
  for (const p of products ?? []) {
    if (existingIds.has(p.id)) continue
    const totalStock = ((p as any).inventory ?? []).reduce(
      (sum: number, inv: any) => sum + (inv.quantity - (inv.reserved_quantity || 0)),
      0,
    )
    const threshold = (p as any).low_stock_threshold || 0
    if (totalStock > threshold) continue

    const supplier = Array.isArray((p as any).supplier) ? (p as any).supplier[0] : (p as any).supplier
    toAdd.push({
      list_id: listId,
      product_id: p.id,
      product_name: p.name,
      sku: p.sku || "",
      supplier_id: supplier?.id ?? null,
      supplier_name: supplier?.name ?? null,
      qty_requested: (p as any).reorder_quantity || threshold || 10,
      unit_cost: (p as any).cost_price || 0,
      status: "pending",
    })
  }

  if (toAdd.length === 0) return { added: 0, error: null }

  const { error: insertError } = await supabase.from("restock_list_items").insert(toAdd)
  if (insertError) return { added: 0, error: insertError.message }

  await supabase
    .from("restock_lists")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", listId)

  return { added: toAdd.length, error: null }
}

export async function addItemToRestockList(
  listId: string,
  item: {
    product_id: string
    variant_id?: string | null
    product_name: string
    variant_name?: string | null
    sku: string
    supplier_id?: string | null
    supplier_name?: string | null
    qty_requested: number
    unit_cost: number
  },
): Promise<{ error: string | null }> {
  const supabase = getSupabaseAdmin()

  // Prevent duplicates
  const { data: existing } = await supabase
    .from("restock_list_items")
    .select("id")
    .eq("list_id", listId)
    .eq("product_id", item.product_id)
    .eq("variant_id", item.variant_id ?? null)
    .maybeSingle()

  if (existing) return { error: null } // already there

  const { error } = await supabase.from("restock_list_items").insert({
    list_id: listId,
    ...item,
    status: "pending",
  })

  if (error) return { error: error.message }

  await supabase
    .from("restock_lists")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", listId)

  return { error: null }
}

export async function updateRestockItem(
  itemId: string,
  updates: Partial<Pick<RestockListItem, "qty_requested" | "unit_cost" | "notes">>,
): Promise<{ error: string | null }> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from("restock_list_items")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", itemId)

  if (error) return { error: error.message }
  return { error: null }
}

export async function removeRestockItem(itemId: string): Promise<{ error: string | null }> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from("restock_list_items").delete().eq("id", itemId)
  if (error) return { error: error.message }
  return { error: null }
}

export async function setItemStatus(
  itemId: string,
  status: RestockItemStatus,
): Promise<{ error: string | null }> {
  const supabase = getSupabaseAdmin()

  // If marking received, also update inventory
  if (status === "received") {
    const { data: item, error: fetchErr } = await supabase
      .from("restock_list_items")
      .select("product_id, variant_id, qty_requested, list_id")
      .eq("id", itemId)
      .single()

    if (fetchErr) return { error: fetchErr.message }

    const { location } = await getDefaultLocation()
    if (location) {
      const locationId = location.id
      const qty = item.qty_requested

      // Upsert inventory
      const invQuery = supabase
        .from("inventory")
        .select("id, quantity")
        .eq("location_id", locationId)
      const withVariant = item.variant_id
        ? invQuery.eq("variant_id", item.variant_id)
        : invQuery.eq("product_id", item.product_id).is("variant_id", null)

      const { data: existingInv } = await withVariant.maybeSingle()

      if (existingInv) {
        await supabase
          .from("inventory")
          .update({ quantity: existingInv.quantity + qty, updated_at: new Date().toISOString() })
          .eq("id", existingInv.id)
      } else {
        await supabase.from("inventory").insert({
          product_id: item.product_id,
          variant_id: item.variant_id,
          location_id: locationId,
          quantity: qty,
        })
      }

      // Record movement
      await supabase.from("stock_movements").insert({
        product_id: item.product_id,
        variant_id: item.variant_id,
        location_id: locationId,
        movement_type: "adjustment",
        quantity: qty,
        notes: "Received via restock list",
      })
    }

    // Update qty_received
    await supabase
      .from("restock_list_items")
      .update({ qty_received: item.qty_requested, status: "received", updated_at: new Date().toISOString() })
      .eq("id", itemId)

    // Check if entire list is now received
    const { data: allItems } = await supabase
      .from("restock_list_items")
      .select("status")
      .eq("list_id", item.list_id)

    const allReceived = allItems?.every((i: any) => i.status === "received")
    if (allReceived) {
      await supabase
        .from("restock_lists")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", item.list_id)
    }

    ;(revalidateTag as any)("inventory", "max")
    return { error: null }
  }

  const { error } = await supabase
    .from("restock_list_items")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", itemId)

  if (error) return { error: error.message }
  return { error: null }
}

export async function bulkSetStatus(
  listId: string,
  status: RestockItemStatus,
  fromStatus?: RestockItemStatus,
): Promise<{ error: string | null }> {
  const supabase = getSupabaseAdmin()

  let query = supabase.from("restock_list_items").select("id").eq("list_id", listId)
  if (fromStatus) query = query.eq("status", fromStatus)
  const { data: items, error: fetchErr } = await query
  if (fetchErr) return { error: fetchErr.message }

  for (const item of items ?? []) {
    const { error } = await setItemStatus(item.id, status)
    if (error) return { error }
  }
  return { error: null }
}

export async function completeRestockList(listId: string): Promise<{ error: string | null }> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from("restock_lists")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", listId)

  if (error) return { error: error.message }
  ;(revalidateTag as any)("inventory", "max")
  return { error: null }
}

export async function renameRestockList(listId: string, name: string): Promise<{ error: string | null }> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from("restock_lists")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", listId)
  if (error) return { error: error.message }
  return { error: null }
}
