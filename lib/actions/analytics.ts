"use server"

import { getSupabaseServer } from "@/lib/supabase/server"

export interface SalesAnalytics {
  totalRevenue: number
  totalOrders: number
  totalProfit: number
  avgOrderValue: number
  revenueChange: number
  ordersChange: number
  profitChange: number
  avgOrderChange: number
}

export interface PaymentBreakdown {
  cash: number
  mpesa: number
  card: number
  other: number
}

export interface TopProduct {
  id: string
  name: string
  sku: string
  quantity_sold: number
  revenue: number
  profit: number
}

export interface SalesTrend {
  date: string
  revenue: number
  orders: number
  profit: number
}

export interface CategorySales {
  category: string
  revenue: number
  quantity: number
}

export interface SupplierSales {
  supplier: string
  revenue: number
  quantity: number
}

export async function getSalesAnalytics(
  dateFrom: string,
  dateTo: string,
  compareDateFrom?: string,
  compareDateTo?: string,
): Promise<{ data: SalesAnalytics | null; error: string | null }> {
  const supabase = await getSupabaseServer()

  // Get current period data
  const { data: currentOrders, error } = await supabase
    .from("orders")
    .select(`
      total_amount,
      paid_amount,
      status,
      subtotal,
      tax_amount,
      items:order_items(cost_price, quantity)
    `)
    .gte("created_at", dateFrom)
    .lte("created_at", dateTo)
    .in("status", ["completed", "layaway"])

  if (error) {
    return { data: null, error: error.message }
  }

  // Calculate metrics with proportional handling for layaway orders
  const totalRevenue =
    currentOrders?.reduce((sum, o) => {
      // For completed orders, use total_amount
      // For layaway orders, use paid_amount (proportional revenue)
      if (o.status === "completed") {
        return sum + (o.total_amount || 0)
      } else if (o.status === "layaway") {
        return sum + (o.paid_amount || 0)
      }
      return sum
    }, 0) || 0

  const totalOrders = currentOrders?.length || 0

  const totalCost =
    currentOrders?.reduce((sum, o) => {
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

  const totalProfit = totalRevenue - totalCost
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Get comparison period data if provided
  let revenueChange = 0,
    ordersChange = 0,
    profitChange = 0,
    avgOrderChange = 0

  if (compareDateFrom && compareDateTo) {
    const { data: prevOrders } = await supabase
      .from("orders")
      .select(`
        total_amount,
        paid_amount,
        status,
        items:order_items(cost_price, quantity)
      `)
      .gte("created_at", compareDateFrom)
      .lte("created_at", compareDateTo)
      .in("status", ["completed", "layaway"])

    if (prevOrders && prevOrders.length > 0) {
      const prevRevenue = prevOrders.reduce((sum, o) => {
        if (o.status === "completed") {
          return sum + (o.total_amount || 0)
        } else if (o.status === "layaway") {
          return sum + (o.paid_amount || 0)
        }
        return sum
      }, 0)

      const prevOrders_count = prevOrders.length

      const prevCost = prevOrders.reduce((sum, o) => {
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
      }, 0)

      const prevProfit = prevRevenue - prevCost
      const prevAvg = prevRevenue / prevOrders_count

      revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0
      ordersChange = prevOrders_count > 0 ? ((totalOrders - prevOrders_count) / prevOrders_count) * 100 : 0
      profitChange = prevProfit > 0 ? ((totalProfit - prevProfit) / prevProfit) * 100 : 0
      avgOrderChange = prevAvg > 0 ? ((avgOrderValue - prevAvg) / prevAvg) * 100 : 0
    }
  }

  return {
    data: {
      totalRevenue,
      totalOrders,
      totalProfit,
      avgOrderValue,
      revenueChange,
      ordersChange,
      profitChange,
      avgOrderChange,
    },
    error: null,
  }
}

export async function getPaymentBreakdown(
  dateFrom: string,
  dateTo: string,
): Promise<{ data: PaymentBreakdown | null; error: string | null }> {
  const supabase = await getSupabaseServer()

  const { data: payments, error } = await supabase
    .from("payments")
    .select(`
      payment_method,
      amount,
      order:orders!inner(status, created_at)
    `)
    .gte("order.created_at", dateFrom)
    .lte("order.created_at", dateTo)
    .eq("order.status", "completed")
    .eq("status", "completed")

  if (error) {
    return { data: null, error: error.message }
  }

  const breakdown: PaymentBreakdown = {
    cash: 0,
    mpesa: 0,
    card: 0,
    other: 0,
  }

  payments?.forEach((p) => {
    switch (p.payment_method) {
      case "cash":
        breakdown.cash += p.amount
        break
      case "mpesa":
        breakdown.mpesa += p.amount
        break
      case "card":
        breakdown.card += p.amount
        break
      default:
        breakdown.other += p.amount
    }
  })

  return { data: breakdown, error: null }
}

export async function getTopProducts(
  dateFrom: string,
  dateTo: string,
  limit = 10,
): Promise<{ data: TopProduct[]; error: string | null }> {
  const supabase = await getSupabaseServer()

  const { data: items, error } = await supabase
    .from("order_items")
    .select(`
      product_id,
      product_name,
      sku,
      quantity,
      unit_price,
      cost_price,
      total_amount,
      order:orders!inner(status, created_at, total_amount, paid_amount)
    `)
    .gte("order.created_at", dateFrom)
    .lte("order.created_at", dateTo)
    .in("order.status", ["completed", "layaway"])

  if (error) {
    return { data: [], error: error.message }
  }

  // Aggregate by product
  const productMap = new Map<string, TopProduct>()

  items?.forEach((item) => {
    const key = item.product_id || item.sku
    const existing = productMap.get(key)

    // Supabase returns joined relations as arrays, get the first element
    const order = Array.isArray(item.order) ? item.order[0] : item.order

    // Calculate revenue and profit based on order status
    let revenue = 0
    let profit = 0

    if (order?.status === "completed") {
      revenue = item.unit_price * item.quantity
      profit = (item.unit_price - item.cost_price) * item.quantity
    } else if (order?.status === "layaway" && order.total_amount > 0) {
      // Calculate proportional revenue and profit for layaway orders
      const paymentRatio = (order.paid_amount || 0) / order.total_amount
      revenue = item.unit_price * item.quantity * paymentRatio
      profit = (item.unit_price - item.cost_price) * item.quantity * paymentRatio
    }

    if (existing) {
      existing.quantity_sold += item.quantity
      existing.revenue += revenue
      existing.profit += profit
    } else {
      productMap.set(key, {
        id: item.product_id || key,
        name: item.product_name,
        sku: item.sku,
        quantity_sold: item.quantity,
        revenue,
        profit,
      })
    }
  })

  const sorted = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)

  return { data: sorted, error: null }
}

export async function getSalesTrend(
  dateFrom: string,
  dateTo: string,
  groupBy: "day" | "week" | "month" = "day",
): Promise<{ data: SalesTrend[]; error: string | null }> {
  const supabase = await getSupabaseServer()

  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      total_amount,
      paid_amount,
      status,
      created_at,
      items:order_items(cost_price, quantity)
    `)
    .gte("created_at", dateFrom)
    .lte("created_at", dateTo)
    .in("status", ["completed", "layaway"])
    .order("created_at")

  if (error) {
    return { data: [], error: error.message }
  }

  // Group by date
  const trendMap = new Map<string, SalesTrend>()

  orders?.forEach((order) => {
    const date = new Date(order.created_at)
    let key: string

    switch (groupBy) {
      case "week":
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split("T")[0]
        break
      case "month":
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        break
      default:
        key = date.toISOString().split("T")[0]
    }

    const orderCost =
      order.items?.reduce(
        (sum: number, item: { cost_price: number; quantity: number }) => sum + item.cost_price * item.quantity,
        0,
      ) || 0

    // Calculate revenue and cost based on order status
    let revenue = 0
    let cost = 0

    if (order.status === "completed") {
      revenue = order.total_amount || 0
      cost = orderCost
    } else if (order.status === "layaway" && order.total_amount > 0) {
      revenue = order.paid_amount || 0
      const paymentRatio = revenue / order.total_amount
      cost = orderCost * paymentRatio
    }

    const profit = revenue - cost

    const existing = trendMap.get(key)
    if (existing) {
      existing.revenue += revenue
      existing.orders += 1
      existing.profit += profit
    } else {
      trendMap.set(key, {
        date: key,
        revenue,
        orders: 1,
        profit,
      })
    }
  })

  return { data: Array.from(trendMap.values()), error: null }
}

export async function getCategorySales(
  dateFrom: string,
  dateTo: string,
): Promise<{ data: CategorySales[]; error: string | null }> {
  const supabase = await getSupabaseServer()

  const { data: items, error } = await supabase
    .from("order_items")
    .select(`
      quantity,
      total_amount,
      product:products(
        category:categories(name)
      ),
      order:orders!inner(status, created_at)
    `)
    .gte("order.created_at", dateFrom)
    .lte("order.created_at", dateTo)
    .eq("order.status", "completed")

  if (error) {
    return { data: [], error: error.message }
  }

  const categoryMap = new Map<string, CategorySales>()

  items?.forEach((item) => {
    const categoryName = (item.product as { category?: { name?: string } })?.category?.name || "Uncategorized"
    const existing = categoryMap.get(categoryName)

    if (existing) {
      existing.revenue += item.total_amount || 0
      existing.quantity += item.quantity
    } else {
      categoryMap.set(categoryName, {
        category: categoryName,
        revenue: item.total_amount || 0,
        quantity: item.quantity,
      })
    }
  })

  return {
    data: Array.from(categoryMap.values()).sort((a, b) => b.revenue - a.revenue),
    error: null,
  }
}

export async function getSupplierSales(
  dateFrom: string,
  dateTo: string,
): Promise<{ data: SupplierSales[]; error: string | null }> {
  const supabase = await getSupabaseServer()

  const { data: items, error } = await supabase
    .from("order_items")
    .select(`
      quantity,
      total_amount,
      product:products(
        supplier:suppliers(name)
      ),
      order:orders!inner(status, created_at)
    `)
    .gte("order.created_at", dateFrom)
    .lte("order.created_at", dateTo)
    .eq("order.status", "completed")

  if (error) {
    return { data: [], error: error.message }
  }

  const supplierMap = new Map<string, SupplierSales>()

  items?.forEach((item) => {
    const supplierName = (item.product as { supplier?: { name?: string } })?.supplier?.name || "Unknown Supplier"
    const existing = supplierMap.get(supplierName)

    if (existing) {
      existing.revenue += item.total_amount || 0
      existing.quantity += item.quantity
    } else {
      supplierMap.set(supplierName, {
        supplier: supplierName,
        revenue: item.total_amount || 0,
        quantity: item.quantity,
      })
    }
  })

  return {
    data: Array.from(supplierMap.values()).sort((a, b) => b.revenue - a.revenue),
    error: null,
  }
}

export async function getHourlySales(
  date: string,
): Promise<{ data: { hour: number; orders: number; revenue: number }[]; error: string | null }> {
  const supabase = await getSupabaseServer()

  const startDate = new Date(date)
  startDate.setHours(0, 0, 0, 0)
  const endDate = new Date(date)
  endDate.setHours(23, 59, 59, 999)

  const { data: orders, error } = await supabase
    .from("orders")
    .select("total_amount, created_at")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString())
    .eq("status", "completed")

  if (error) {
    return { data: [], error: error.message }
  }

  // Initialize all hours
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    orders: 0,
    revenue: 0,
  }))

  orders?.forEach((order) => {
    const hour = new Date(order.created_at).getHours()
    hourlyData[hour].orders += 1
    hourlyData[hour].revenue += order.total_amount || 0
  })

  return { data: hourlyData, error: null }
}
