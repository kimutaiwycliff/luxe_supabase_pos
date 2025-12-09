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

export interface LayawayOrderSummary {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  total_amount: number
  paid_amount: number
  balance: number
  due_date: string | null
  is_overdue: boolean
  items_count: number
  created_at: string
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
      paid_amount,
      status,
      items:order_items(cost_price, quantity)
    `)
    .gte("created_at", todayStr)
    .in("status", ["completed", "layaway"])

  if (todayError) {
    return { data: null, error: todayError.message }
  }

  // Get yesterday's orders for comparison
  const { data: yesterdayOrders } = await supabase
    .from("orders")
    .select(`
      total_amount,
      paid_amount,
      status,
      items:order_items(cost_price, quantity)
    `)
    .gte("created_at", yesterdayStr)
    .lt("created_at", todayStr)
    .in("status", ["completed", "layaway"])

  // Calculate today's stats with proportional handling for layaway
  const todayRevenue =
    todayOrders?.reduce((sum, o) => {
      if (o.status === "completed") {
        return sum + (o.total_amount || 0)
      } else if (o.status === "layaway") {
        return sum + (o.paid_amount || 0)
      }
      return sum
    }, 0) || 0

  const todayOrderCount = todayOrders?.length || 0

  const todayCost =
    todayOrders?.reduce((sum, o) => {
      const orderCost =
        o.items?.reduce(
          (itemSum: number, item: { cost_price: number; quantity: number }) =>
            itemSum + item.cost_price * item.quantity,
          0,
        ) || 0

      // For layaway orders, calculate proportional cost
      if (o.status === "layaway" && o.total_amount > 0) {
        const paymentRatio = (o.paid_amount || 0) / o.total_amount
        return sum + orderCost * paymentRatio
      }

      return sum + orderCost
    }, 0) || 0

  const todayProfit = todayRevenue - todayCost

  // Calculate yesterday's stats with proportional handling for layaway
  const yesterdayRevenue =
    yesterdayOrders?.reduce((sum, o) => {
      if (o.status === "completed") {
        return sum + (o.total_amount || 0)
      } else if (o.status === "layaway") {
        return sum + (o.paid_amount || 0)
      }
      return sum
    }, 0) || 0

  const yesterdayOrderCount = yesterdayOrders?.length || 0

  const yesterdayCost =
    yesterdayOrders?.reduce((sum, o) => {
      const orderCost =
        o.items?.reduce(
          (itemSum: number, item: { cost_price: number; quantity: number }) =>
            itemSum + item.cost_price * item.quantity,
          0,
        ) || 0

      // For layaway orders, calculate proportional cost
      if (o.status === "layaway" && o.total_amount > 0) {
        const paymentRatio = (o.paid_amount || 0) / o.total_amount
        return sum + orderCost * paymentRatio
      }

      return sum + orderCost
    }, 0) || 0

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
    .select("total_amount, paid_amount, status, created_at")
    .gte("created_at", sevenDaysAgo.toISOString())
    .in("status", ["completed", "layaway"])
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

  // Aggregate orders with proportional revenue for layaway
  orders?.forEach((order) => {
    const date = new Date(order.created_at)
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" })
    const existing = dailyMap.get(dayName)
    if (existing) {
      // For completed orders, use total_amount; for layaway, use paid_amount
      const revenue =
        order.status === "completed" ? order.total_amount || 0 : order.paid_amount || 0
      existing.revenue += revenue
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
      product:products!product_id(
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
      variant:product_variants!variant_id(
        id,
        sku,
        name,
        product:products!product_id(
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
    // Handle Supabase's array response for the product relationship
    const productData = Array.isArray(inv.product) ? inv.product[0] : inv.product
    if (!productData) return

    const product = productData as { id: string; name: string; sku: string; low_stock_threshold: number }
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
    // Handle Supabase's array response for the variant relationship
    const variantData = Array.isArray(inv.variant) ? inv.variant[0] : inv.variant
    if (!variantData) return

    const variant = variantData as {
      id: string
      sku: string
      name: string
      product: any
    }

    // Handle nested product array
    const productData = Array.isArray(variant.product) ? variant.product[0] : variant.product
    if (!productData) return

    const product = productData as { id: string; name: string; low_stock_threshold: number }

    if (inv.quantity <= product.low_stock_threshold) {
      items.push({
        id: product.id,
        name: `${product.name} - ${variant.name || variant.sku}`,
        sku: variant.sku,
        quantity: inv.quantity,
        threshold: product.low_stock_threshold,
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
      customer:customers!customer_id(first_name, last_name),
      items:order_items(id),
      payments(payment_method, amount)
    `)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    return { orders: [], error: error.message }
  }

  // Transform the data to handle Supabase's array response for relationships
  const transformedData = data?.map((order: any) => ({
    ...order,
    customer: Array.isArray(order.customer)
      ? (order.customer.length > 0 ? order.customer[0] : null)
      : order.customer
  })) || []

  return { orders: transformedData, error: null }
}

export async function getLayawayStats(): Promise<{
  data: {
    totalLayaways: number
    totalReservedValue: number
    totalCollected: number
    totalPending: number
    overdueCount: number
  } | null
  error: string | null
}> {
  const supabase = await getSupabaseServer()

  const { data: layaways, error } = await supabase
    .from("orders")
    .select("total_amount, paid_amount, layaway_due_date")
    .eq("status", "layaway")

  if (error) {
    return { data: null, error: error.message }
  }

  const today = new Date().toISOString().split("T")[0]
  let totalReservedValue = 0
  let totalCollected = 0
  let overdueCount = 0

  layaways?.forEach((order) => {
    totalReservedValue += order.total_amount || 0
    totalCollected += order.paid_amount || 0
    if (order.layaway_due_date && order.layaway_due_date < today) {
      overdueCount++
    }
  })

  return {
    data: {
      totalLayaways: layaways?.length || 0,
      totalReservedValue,
      totalCollected,
      totalPending: totalReservedValue - totalCollected,
      overdueCount,
    },
    error: null,
  }
}

export async function getRecentLayaways(limit = 5): Promise<{
  data: LayawayOrderSummary[]
  error: string | null
}> {
  const supabase = await getSupabaseServer()

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      total_amount,
      paid_amount,
      layaway_customer_name,
      layaway_customer_phone,
      layaway_due_date,
      created_at,
      items:order_items(id)
    `)
    .eq("status", "layaway")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    return { data: [], error: error.message }
  }

  const today = new Date().toISOString().split("T")[0]

  const layaways: LayawayOrderSummary[] = (data || []).map((order) => ({
    id: order.id,
    order_number: order.order_number,
    customer_name: order.layaway_customer_name || "Unknown",
    customer_phone: order.layaway_customer_phone || "",
    total_amount: order.total_amount,
    paid_amount: order.paid_amount,
    balance: order.total_amount - order.paid_amount,
    due_date: order.layaway_due_date,
    is_overdue: order.layaway_due_date ? order.layaway_due_date < today : false,
    items_count: order.items?.length || 0,
    created_at: order.created_at,
  }))

  return { data: layaways, error: null }
}

