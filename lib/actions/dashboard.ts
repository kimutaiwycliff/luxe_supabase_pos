"use server"

import { getSupabaseServer } from "@/lib/supabase/server"

export interface DashboardStats {
  todayRevenue: number
  todayOrders: number
  totalProducts: number
  todayProfit: number
  revenueChange: number
  ordersChange: number
  productsChange: number
  profitChange: number
}

export interface WeeklySalesData {
  date: string
  revenue: number
  orders: number
}

export interface LowStockItem {
  id: string
  name: string
  sku: string
  quantity: number
  threshold: number
  variant_id?: string
}

export async function getDashboardStats(): Promise<{ data: DashboardStats | null; error: string | null }> {
  const supabase = await getSupabaseServer()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString()

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString()

  // Get today's orders with cost data
  const { data: todayOrders, error: todayError } = await supabase
    .from("orders")
    .select(`
      total_amount,
      items:order_items(cost_price, quantity)
    `)
    .gte("created_at", todayStr)
    .eq("status", "completed")

  if (todayError) {
    return { data: null, error: todayError.message }
  }

  // Get yesterday's orders for comparison
  const { data: yesterdayOrders } = await supabase
    .from("orders")
    .select(`
      total_amount,
      items:order_items(cost_price, quantity)
    `)
    .gte("created_at", yesterdayStr)
    .lt("created_at", todayStr)
    .eq("status", "completed")

  // Calculate today's stats
  const todayRevenue = todayOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
  const todayOrderCount = todayOrders?.length || 0
  const todayCost =
    todayOrders?.reduce(
      (sum, o) =>
        sum +
        (o.items?.reduce(
          (itemSum: number, item: { cost_price: number; quantity: number }) =>
            itemSum + item.cost_price * item.quantity,
          0,
        ) || 0),
      0,
    ) || 0
  const todayProfit = todayRevenue - todayCost

  // Calculate yesterday's stats
  const yesterdayRevenue = yesterdayOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
  const yesterdayOrderCount = yesterdayOrders?.length || 0
  const yesterdayCost =
    yesterdayOrders?.reduce(
      (sum, o) =>
        sum +
        (o.items?.reduce(
          (itemSum: number, item: { cost_price: number; quantity: number }) =>
            itemSum + item.cost_price * item.quantity,
          0,
        ) || 0),
      0,
    ) || 0
  const yesterdayProfit = yesterdayRevenue - yesterdayCost

  // Get total products count
  const { count: totalProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)

  // Get last week's product count for comparison
  const lastWeek = new Date(today)
  lastWeek.setDate(lastWeek.getDate() - 7)
  const { count: lastWeekProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)
    .lt("created_at", lastWeek.toISOString())

  // Calculate percentage changes
  const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0
  const ordersChange =
    yesterdayOrderCount > 0 ? ((todayOrderCount - yesterdayOrderCount) / yesterdayOrderCount) * 100 : 0
  const profitChange = yesterdayProfit > 0 ? ((todayProfit - yesterdayProfit) / yesterdayProfit) * 100 : 0
  const productsChange = lastWeekProducts ? (((totalProducts || 0) - lastWeekProducts) / lastWeekProducts) * 100 : 0

  return {
    data: {
      todayRevenue,
      todayOrders: todayOrderCount,
      totalProducts: totalProducts || 0,
      todayProfit,
      revenueChange,
      ordersChange,
      productsChange,
      profitChange,
    },
    error: null,
  }
}

export async function getWeeklySales(): Promise<{ data: WeeklySalesData[]; error: string | null }> {
  const supabase = await getSupabaseServer()

  const today = new Date()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const { data: orders, error } = await supabase
    .from("orders")
    .select("total_amount, created_at")
    .gte("created_at", sevenDaysAgo.toISOString())
    .eq("status", "completed")
    .order("created_at")

  if (error) {
    return { data: [], error: error.message }
  }

  // Group by day
  const dailyMap = new Map<string, { revenue: number; orders: number }>()

  // Initialize all 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date(sevenDaysAgo)
    date.setDate(date.getDate() + i)
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" })
    dailyMap.set(dayName, { revenue: 0, orders: 0 })
  }

  // Aggregate orders
  orders?.forEach((order) => {
    const date = new Date(order.created_at)
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" })
    const existing = dailyMap.get(dayName)
    if (existing) {
      existing.revenue += order.total_amount || 0
      existing.orders += 1
    }
  })

  const result: WeeklySalesData[] = Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    revenue: data.revenue,
    orders: data.orders,
  }))

  return { data: result, error: null }
}

export async function getLowStockItems(limit = 5): Promise<{ data: LowStockItem[]; error: string | null }> {
  const supabase = await getSupabaseServer()

  // Get low stock products without variants
  const { data: lowStockProducts, error: productsError } = await supabase
    .from("inventory")
    .select(`
      quantity,
      product:products!inner(
        id,
        name,
        sku,
        low_stock_threshold,
        has_variants
      )
    `)
    .eq("product.has_variants", false)
    .order("quantity", { ascending: true })
    .limit(limit * 2)

  if (productsError) {
    console.error("Error fetching low stock products:", productsError)
  }

  // Get low stock variants
  const { data: lowStockVariants, error: variantsError } = await supabase
    .from("inventory")
    .select(`
      quantity,
      variant:product_variants!inner(
        id,
        sku,
        name,
        product:products!inner(
          id,
          name,
          low_stock_threshold
        )
      )
    `)
    .not("variant_id", "is", null)
    .order("quantity", { ascending: true })
    .limit(limit * 2)

  if (variantsError) {
    console.error("Error fetching low stock variants:", variantsError)
  }

  const items: LowStockItem[] = []

  // Process products
  lowStockProducts?.forEach((inv) => {
    const product = inv.product as { id: string; name: string; sku: string; low_stock_threshold: number }
    if (inv.quantity <= product.low_stock_threshold) {
      items.push({
        id: product.id,
        name: product.name,
        sku: product.sku,
        quantity: inv.quantity,
        threshold: product.low_stock_threshold,
      })
    }
  })

  // Process variants
  lowStockVariants?.forEach((inv) => {
    const variant = inv.variant as {
      id: string
      sku: string
      name: string
      product: { id: string; name: string; low_stock_threshold: number }
    }
    if (inv.quantity <= variant.product.low_stock_threshold) {
      items.push({
        id: variant.product.id,
        name: `${variant.product.name} - ${variant.name || variant.sku}`,
        sku: variant.sku,
        quantity: inv.quantity,
        threshold: variant.product.low_stock_threshold,
        variant_id: variant.id,
      })
    }
  })

  // Sort by quantity and limit
  items.sort((a, b) => a.quantity - b.quantity)

  return { data: items.slice(0, limit), error: null }
}

export async function getRecentOrdersForDashboard(limit = 5) {
  const supabase = await getSupabaseServer()

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      total_amount,
      status,
      payment_status,
      created_at,
      customer:customers(first_name, last_name),
      items:order_items(id),
      payments(payment_method)
    `)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    return { orders: [], error: error.message }
  }

  return { orders: data || [], error: null }
}
