"use server"

import { getSupabaseServer } from "@/lib/supabase/server"
import { revalidateTag } from "next/cache"

export type PurchaseOrderStatus = "draft" | "sent" | "confirmed" | "shipped" | "received" | "cancelled"

export async function getPurchaseOrders(status?: PurchaseOrderStatus) {
  const supabase = await getSupabaseServer()

  let query = supabase
    .from("purchase_orders")
    .select(`
      *,
      supplier:suppliers(id, name, email, phone),
      items:purchase_order_items(
        id,
        quantity_ordered,
        quantity_received,
        unit_cost,
        product:products(id, name, sku),
        variant:product_variants(id, sku, name)
      )
    `)
    .order("created_at", { ascending: false })

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function getPurchaseOrder(id: string) {
  const supabase = await getSupabaseServer()

  const { data, error } = await supabase
    .from("purchase_orders")
    .select(`
      *,
      supplier:suppliers(*),
      items:purchase_order_items(
        *,
        product:products(id, name, sku, cost_price),
        variant:product_variants(id, sku, name, cost_price)
      )
    `)
    .eq("id", id)
    .single()

  if (error) throw error
  return data
}

export async function createPurchaseOrder(
  supplierId: string,
  items: Array<{
    product_id: string
    variant_id?: string | null
    quantity_ordered: number
    unit_cost: number
  }>,
  notes?: string,
) {
  const supabase = await getSupabaseServer()

  // Generate PO number
  const { data: lastPo } = await supabase
    .from("purchase_orders")
    .select("po_number")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  const nextNumber = lastPo ? Number.parseInt(lastPo.po_number.replace("PO-", "")) + 1 : 1
  const poNumber = `PO-${nextNumber.toString().padStart(6, "0")}`

  // Calculate total
  const totalAmount = items.reduce((sum, item) => sum + item.quantity_ordered * item.unit_cost, 0)

  // Create purchase order
  const { data: po, error: poError } = await supabase
    .from("purchase_orders")
    .insert({
      po_number: poNumber,
      supplier_id: supplierId,
      status: "draft",
      total_amount: totalAmount,
      notes,
    })
    .select()
    .single()

  if (poError) throw poError

  // Create order items
  const orderItems = items.map((item) => ({
    purchase_order_id: po.id,
    product_id: item.product_id,
    variant_id: item.variant_id || null,
    quantity_ordered: item.quantity_ordered,
    quantity_received: 0,
    unit_cost: item.unit_cost,
  }))

  const { error: itemsError } = await supabase.from("purchase_order_items").insert(orderItems)

  if (itemsError) throw itemsError

  revalidateTag("purchase-orders", "max")
  return po
}

export async function updatePurchaseOrderStatus(id: string, status: PurchaseOrderStatus) {
  const supabase = await getSupabaseServer()

  const updateData: Record<string, unknown> = { status }

  if (status === "sent") {
    updateData.sent_at = new Date().toISOString()
  } else if (status === "received") {
    updateData.received_at = new Date().toISOString()
  }

  const { data, error } = await supabase.from("purchase_orders").update(updateData).eq("id", id).select().single()

  if (error) throw error

  revalidateTag("purchase-orders", "max")
  return data
}

export async function receivePurchaseOrder(
  id: string,
  receivedItems: Array<{
    item_id: string
    quantity_received: number
  }>,
  locationId: string,
) {
  const supabase = await getSupabaseServer()

  // Get purchase order with items
  const { data: po, error: poError } = await supabase
    .from("purchase_orders")
    .select(`
      *,
      items:purchase_order_items(
        id,
        product_id,
        variant_id,
        quantity_ordered,
        quantity_received,
        unit_cost
      )
    `)
    .eq("id", id)
    .single()

  if (poError) throw poError

  // Update each item's received quantity and adjust inventory
  for (const received of receivedItems) {
    const item = po.items.find((i: { id: string }) => i.id === received.item_id)
    if (!item) continue

    const newQuantityReceived = (item.quantity_received || 0) + received.quantity_received

    // Update purchase order item
    await supabase
      .from("purchase_order_items")
      .update({ quantity_received: newQuantityReceived })
      .eq("id", received.item_id)

    // Update inventory
    const { data: existingInventory } = await supabase
      .from("inventory")
      .select("id, quantity")
      .eq("product_id", item.product_id)
      .eq("location_id", locationId)
      .is("variant_id", item.variant_id || null)
      .single()

    if (existingInventory) {
      await supabase
        .from("inventory")
        .update({ quantity: existingInventory.quantity + received.quantity_received })
        .eq("id", existingInventory.id)
    } else {
      await supabase.from("inventory").insert({
        product_id: item.product_id,
        variant_id: item.variant_id,
        location_id: locationId,
        quantity: received.quantity_received,
        reserved_quantity: 0,
      })
    }

    // Record stock movement
    await supabase.from("stock_movements").insert({
      product_id: item.product_id,
      variant_id: item.variant_id,
      location_id: locationId,
      movement_type: "purchase",
      quantity: received.quantity_received,
      reference_type: "purchase_order",
      reference_id: po.id,
      notes: `Received from PO ${po.po_number}`,
    })
  }

  // Check if all items are fully received
  const { data: updatedItems } = await supabase
    .from("purchase_order_items")
    .select("quantity_ordered, quantity_received")
    .eq("purchase_order_id", id)

  const allReceived = updatedItems?.every(
    (item: { quantity_ordered: number; quantity_received: number }) => item.quantity_received >= item.quantity_ordered,
  )

  if (allReceived) {
    await supabase
      .from("purchase_orders")
      .update({ status: "received", received_at: new Date().toISOString() })
      .eq("id", id)
  }

  revalidateTag("purchase-orders", "max")
  revalidateTag("inventory", "max")
  revalidateTag("products", "max")
}

export async function getReorderAlerts() {
  const supabase = await getSupabaseServer()

  const { data, error } = await supabase
    .from("reorder_alerts")
    .select(`
      *,
      product:products(
        id,
        name,
        sku,
        cost_price,
        supplier:suppliers(id, name, email)
      ),
      variant:product_variants(id, sku, name)
    `)
    .eq("is_resolved", false)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function resolveReorderAlert(id: string) {
  const supabase = await getSupabaseServer()

  const { error } = await supabase.from("reorder_alerts").update({ is_resolved: true }).eq("id", id)

  if (error) throw error

  revalidateTag("reorder-alerts", "max")
}

export async function getLowStockProducts() {
  const supabase = await getSupabaseServer()

  // Get products where any inventory is below reorder point
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      sku,
      cost_price,
      reorder_point,
      reorder_quantity,
      supplier:suppliers(id, name, email, phone),
      inventory:inventory(
        quantity,
        reserved_quantity,
        location:locations(id, name)
      )
    `)
    .eq("is_active", true)
    .not("supplier_id", "is", null)

  if (error) throw error

  // Filter to only low stock items
  return (
    data?.filter((product) => {
      const totalStock =
        product.inventory?.reduce(
          (sum: number, inv: { quantity: number; reserved_quantity: number }) =>
            sum + (inv.quantity - inv.reserved_quantity),
          0,
        ) || 0
      return totalStock <= (product.reorder_point || 0)
    }) || []
  )
}
