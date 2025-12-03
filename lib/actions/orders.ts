"use server"

import { getSupabaseServer } from "@/lib/supabase/server"
import { revalidateTag } from "next/cache"
import type { Order } from "@/lib/types"

export interface CreateOrderData {
  customer_id?: string
  location_id: string
  items: {
    product_id?: string
    variant_id?: string
    product_name: string
    variant_name?: string
    sku: string
    quantity: number
    unit_price: number
    cost_price: number
    discount_amount?: number
    tax_rate?: number
  }[]
  discount_id?: string
  discount_amount?: number
  notes?: string
  payments: {
    payment_method: "cash" | "mpesa" | "card" | "bank_transfer"
    amount: number
    reference_number?: string
    mpesa_receipt_number?: string
    mpesa_phone_number?: string
  }[]
}

export async function getOrders(options?: {
  status?: string
  payment_status?: string
  date_from?: string
  date_to?: string
  customer_id?: string
  limit?: number
  offset?: number
}) {
  const supabase = await getSupabaseServer()

  let query = supabase
    .from("orders")
    .select(
      `
      *,
      customer:customers(id, first_name, last_name, email, phone),
      items:order_items(*),
      payments(*)
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })

  if (options?.status) {
    query = query.eq("status", options.status)
  }

  if (options?.payment_status) {
    query = query.eq("payment_status", options.payment_status)
  }

  if (options?.customer_id) {
    query = query.eq("customer_id", options.customer_id)
  }

  if (options?.date_from) {
    query = query.gte("created_at", options.date_from)
  }

  if (options?.date_to) {
    query = query.lte("created_at", options.date_to)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error, count } = await query

  if (error) {
    console.error("Error fetching orders:", error)
    return { orders: [], count: 0, error: error.message }
  }

  return { orders: data as Order[], count: count || 0, error: null }
}

export async function getOrderById(id: string) {
  const supabase = await getSupabaseServer()

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      customer:customers(id, first_name, last_name, email, phone),
      items:order_items(*),
      payments(*)
    `)
    .eq("id", id)
    .single()

  if (error) {
    return { order: null, error: error.message }
  }

  return { order: data as Order, error: null }
}

export async function createOrder(data: CreateOrderData) {
  const supabase = await getSupabaseServer()

  if (!data.location_id) {
    return { order: null, error: "Location ID is required. Please run the seed scripts to create a default location." }
  }

  // Verify location exists in database
  const { data: locationExists, error: locationError } = await supabase
    .from("locations")
    .select("id")
    .eq("id", data.location_id)
    .single()

  if (locationError || !locationExists) {
    console.error("[v0] Location not found:", data.location_id, locationError)
    return {
      order: null,
      error: `Location not found (${data.location_id}). Please run scripts/004_seed_data.sql to create a default location.`,
    }
  }

  const subtotal = data.items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity - (item.discount_amount || 0),
    0,
  )
  // const totalCost = data.items.reduce((sum, item) => sum + item.cost_price * item.quantity, 0)
  const discountAmount = data.discount_amount || 0

  const taxAmount = data.items.reduce((sum, item) => {
    const itemSubtotal = item.unit_price * item.quantity - (item.discount_amount || 0)
    const itemTaxRate = item.tax_rate ?? 0 // Default to 0% if not provided
    return sum + itemSubtotal * itemTaxRate
  }, 0)

  // Apply order-level discount proportionally to tax
  const discountRatio = subtotal > 0 ? (subtotal - discountAmount) / subtotal : 1
  const adjustedTaxAmount = taxAmount * discountRatio

  const totalAmount = subtotal - discountAmount + adjustedTaxAmount

  const totalPaid = data.payments.reduce((sum, p) => sum + p.amount, 0)
  const paymentStatus = totalPaid >= totalAmount ? "completed" : totalPaid > 0 ? "partial" : "pending"

  // Create the order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: data.customer_id || null,
      location_id: data.location_id,
      status: "completed",
      payment_status: paymentStatus,
      subtotal,
      discount_amount: discountAmount,
      tax_amount: adjustedTaxAmount,
      total_amount: totalAmount,
      paid_amount: totalPaid,
      change_amount: totalPaid > totalAmount ? totalPaid - totalAmount : 0,
      notes: data.notes || null,
      discount_id: data.discount_id || null,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (orderError) {
    console.error("Error creating order:", orderError)
    return { order: null, error: orderError.message }
  }

  const orderItems = data.items.map((item) => {
    const itemSubtotal = item.unit_price * item.quantity - (item.discount_amount || 0)
    const itemTaxRate = item.tax_rate ?? 0
    const itemTax = itemSubtotal * itemTaxRate * discountRatio

    return {
      order_id: order.id,
      product_id: item.product_id || null,
      variant_id: item.variant_id || null,
      product_name: item.product_name,
      variant_name: item.variant_name || null,
      sku: item.sku,
      quantity: item.quantity,
      unit_price: item.unit_price,
      cost_price: item.cost_price,
      discount_amount: item.discount_amount || 0,
      tax_amount: itemTax,
      total_amount: itemSubtotal + itemTax,
    }
  })

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

  if (itemsError) {
    console.error("Error creating order items:", itemsError)
  }

  // Create payments
  const payments = data.payments.map((payment) => ({
    order_id: order.id,
    payment_method: payment.payment_method,
    amount: payment.amount,
    reference_number: payment.reference_number || null,
    mpesa_receipt_number: payment.mpesa_receipt_number || null,
    mpesa_phone_number: payment.mpesa_phone_number || null,
    status: "completed",
    processed_at: new Date().toISOString(),
  }))

  const { error: paymentsError } = await supabase.from("payments").insert(payments)

  if (paymentsError) {
    console.error("Error creating payments:", paymentsError)
  }

  // Update inventory (reduce stock)
  for (const item of data.items) {
    const { data: inventory } = await supabase
      .from("inventory")
      .select("*")
      .eq("location_id", data.location_id)
      .eq(item.variant_id ? "variant_id" : "product_id", item.variant_id || item.product_id)
      .single()

    if (inventory) {
      await supabase
        .from("inventory")
        .update({
          quantity: Math.max(0, inventory.quantity - item.quantity),
          updated_at: new Date().toISOString(),
        })
        .eq("id", inventory.id)

      // Record stock movement
      await supabase.from("stock_movements").insert({
        product_id: item.product_id || null,
        variant_id: item.variant_id || null,
        location_id: data.location_id,
        movement_type: "sale",
        quantity: -item.quantity,
        reference_type: "order",
        reference_id: order.id,
      })
    }
  }

  // Update customer stats if customer exists
  if (data.customer_id) {
    const { data: customer } = await supabase
      .from("customers")
      .select("total_spent, total_orders, loyalty_points")
      .eq("id", data.customer_id)
      .single()

    if (customer) {
      await supabase
        .from("customers")
        .update({
          total_spent: customer.total_spent + totalAmount,
          total_orders: customer.total_orders + 1,
          loyalty_points: customer.loyalty_points + Math.floor(totalAmount / 100),
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.customer_id)
    }
  }

  revalidateTag("orders", "max")
  revalidateTag("inventory", "max")
  revalidateTag("analytics", "max")

  const { data: completeOrder, error: fetchError } = await supabase
    .from("orders")
    .select(`
      *,
      customer:customers(id, first_name, last_name, email, phone),
      items:order_items(*),
      payments(*)
    `)
    .eq("id", order.id)
    .single()

  if (fetchError) {
    console.error("Error fetching complete order:", fetchError)
    return { order: order as Order, error: null }
  }

  return { order: completeOrder as Order, error: null }
}

export async function getRecentOrders(limit = 10) {
  const supabase = await getSupabaseServer()

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      customer:customers(id, first_name, last_name),
      items:order_items(id)
    `)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    return { orders: [], error: error.message }
  }

  return { orders: data as Order[], error: null }
}

export async function getTodayStats(locationId?: string) {
  const supabase = await getSupabaseServer()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString()

  let query = supabase
    .from("orders")
    .select("total_amount, status, payments(payment_method, amount)")
    .gte("created_at", todayStr)
    .eq("status", "completed")

  if (locationId) {
    query = query.eq("location_id", locationId)
  }

  const { data, error } = await query

  if (error) {
    return {
      revenue: 0,
      orders: 0,
      cash: 0,
      mpesa: 0,
      card: 0,
      error: error.message,
    }
  }

  const revenue = data?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
  const orders = data?.length || 0

  let cash = 0,
    mpesa = 0,
    card = 0
    data?.forEach((order) => {
      order.payments?.forEach((p) => {
        if (p.payment_method === "cash") cash += p.amount
        else if (p.payment_method === "mpesa") mpesa += p.amount
        else if (p.payment_method === "card") card += p.amount
      })
    })

  return { revenue, orders, cash, mpesa, card, error: null }
}
