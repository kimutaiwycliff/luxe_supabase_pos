import { NextResponse } from "next/server"
import { subDays, format } from "date-fns"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { sendDailyReport } from "@/lib/services/email"
import type { SalesAnalytics, PaymentBreakdown, TopProduct, CategorySales } from "@/lib/actions/analytics"

const REPORT_EMAIL = "kimtaiwiki@gmail.com"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()

    // Yesterday's date range
    const yesterday = subDays(new Date(), 1)
    const dateFrom = new Date(yesterday)
    dateFrom.setHours(0, 0, 0, 0)
    const dateTo = new Date(yesterday)
    dateTo.setHours(23, 59, 59, 999)

    // Day before for comparison
    const dayBefore = subDays(yesterday, 1)
    const compareDateFrom = new Date(dayBefore)
    compareDateFrom.setHours(0, 0, 0, 0)
    const compareDateTo = new Date(dayBefore)
    compareDateTo.setHours(23, 59, 59, 999)

    const dateFromISO = dateFrom.toISOString()
    const dateToISO = dateTo.toISOString()
    const compareDateFromISO = compareDateFrom.toISOString()
    const compareDateToISO = compareDateTo.toISOString()

    // ── Fetch all data in parallel ──────────────────────────────────────────
    const [currentOrdersRes, prevOrdersRes, paymentsRes, orderItemsRes] = await Promise.all([
      supabase
        .from("orders")
        .select("total_amount, paid_amount, status, items:order_items(cost_price, quantity)")
        .gte("created_at", dateFromISO)
        .lte("created_at", dateToISO)
        .in("status", ["completed", "layaway"]),

      supabase
        .from("orders")
        .select("total_amount, paid_amount, status, items:order_items(cost_price, quantity)")
        .gte("created_at", compareDateFromISO)
        .lte("created_at", compareDateToISO)
        .in("status", ["completed", "layaway"]),

      supabase
        .from("payments")
        .select("payment_method, amount, order:orders!inner(status, created_at)")
        .gte("order.created_at", dateFromISO)
        .lte("order.created_at", dateToISO)
        .eq("order.status", "completed")
        .eq("status", "completed"),

      supabase
        .from("order_items")
        .select(`
          product_id, product_name, sku, quantity, unit_price, cost_price, total_amount,
          order:orders!inner(status, created_at, total_amount, paid_amount),
          product:products(category:categories(name), supplier:suppliers(name))
        `)
        .gte("order.created_at", dateFromISO)
        .lte("order.created_at", dateToISO)
        .in("order.status", ["completed", "layaway"]),
    ])

    // ── Sales analytics ─────────────────────────────────────────────────────
    const calcMetrics = (orders: typeof currentOrdersRes.data) => {
      let revenue = 0, cost = 0
      const count = orders?.length ?? 0
      orders?.forEach((o: any) => {
        if (o.status === "completed") revenue += o.total_amount ?? 0
        else if (o.status === "layaway") revenue += o.paid_amount ?? 0

        const orderCost = o.items?.reduce((s: number, i: any) => s + i.cost_price * i.quantity, 0) ?? 0
        if (o.status === "layaway" && o.total_amount > 0) {
          cost += orderCost * ((o.paid_amount ?? 0) / o.total_amount)
        } else {
          cost += orderCost
        }
      })
      return { revenue, profit: revenue - cost, count, avg: count > 0 ? revenue / count : 0 }
    }

    const cur = calcMetrics(currentOrdersRes.data)
    const prev = calcMetrics(prevOrdersRes.data)

    const pctChange = (a: number, b: number) => (b > 0 ? ((a - b) / b) * 100 : 0)

    const analytics: SalesAnalytics = {
      totalRevenue: cur.revenue,
      totalOrders: cur.count,
      totalProfit: cur.profit,
      avgOrderValue: cur.avg,
      revenueChange: pctChange(cur.revenue, prev.revenue),
      ordersChange: pctChange(cur.count, prev.count),
      profitChange: pctChange(cur.profit, prev.profit),
      avgOrderChange: pctChange(cur.avg, prev.avg),
    }

    // ── Payment breakdown ───────────────────────────────────────────────────
    const payments: PaymentBreakdown = { cash: 0, mpesa: 0, card: 0, other: 0 }
    paymentsRes.data?.forEach((p: any) => {
      if (p.payment_method === "cash") payments.cash += p.amount
      else if (p.payment_method === "mpesa") payments.mpesa += p.amount
      else if (p.payment_method === "card") payments.card += p.amount
      else payments.other += p.amount
    })

    // ── Top products ────────────────────────────────────────────────────────
    const productMap = new Map<string, TopProduct>()
    orderItemsRes.data?.forEach((item: any) => {
      const order = Array.isArray(item.order) ? item.order[0] : item.order
      const key = item.product_id || item.sku
      let revenue = 0, profit = 0
      if (order?.status === "completed") {
        revenue = item.unit_price * item.quantity
        profit = (item.unit_price - item.cost_price) * item.quantity
      } else if (order?.status === "layaway" && order.total_amount > 0) {
        const ratio = (order.paid_amount ?? 0) / order.total_amount
        revenue = item.unit_price * item.quantity * ratio
        profit = (item.unit_price - item.cost_price) * item.quantity * ratio
      }
      const existing = productMap.get(key)
      if (existing) {
        existing.quantity_sold += item.quantity
        existing.revenue += revenue
        existing.profit += profit
      } else {
        productMap.set(key, { id: item.product_id || key, name: item.product_name, sku: item.sku, quantity_sold: item.quantity, revenue, profit })
      }
    })
    const topProducts: TopProduct[] = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // ── Category sales ──────────────────────────────────────────────────────
    const categoryMap = new Map<string, CategorySales>()
    orderItemsRes.data?.forEach((item: any) => {
      const order = Array.isArray(item.order) ? item.order[0] : item.order
      if (order?.status !== "completed") return
      const product = Array.isArray(item.product) ? item.product[0] : item.product
      const name = product?.category?.name || "Uncategorized"
      const existing = categoryMap.get(name)
      if (existing) { existing.revenue += item.total_amount ?? 0; existing.quantity += item.quantity }
      else categoryMap.set(name, { category: name, revenue: item.total_amount ?? 0, quantity: item.quantity })
    })
    const categorySales: CategorySales[] = Array.from(categoryMap.values()).sort((a, b) => b.revenue - a.revenue)

    // ── Send email ──────────────────────────────────────────────────────────
    const reportDate = format(yesterday, "EEEE, MMMM d, yyyy")
    const result = await sendDailyReport({ reportDate, analytics, payments, topProducts, categorySales }, REPORT_EMAIL)

    if (!result.success) {
      return NextResponse.json({ error: `Email error: ${result.error}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, reportDate, sentTo: REPORT_EMAIL })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
