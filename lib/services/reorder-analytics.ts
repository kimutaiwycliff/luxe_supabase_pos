"use server"

import { getSupabaseServer } from "@/lib/supabase/server"
import { subDays, format } from "date-fns"

export interface SalesVelocity {
    productId: string
    productName: string
    sku: string
    last30DaysSales: number
    last60DaysSales: number
    dailyAverage: number
    trend: "up" | "down" | "stable"
    profitMargin: number
}

export interface InventoryStatus {
    productId: string
    productName: string
    currentStock: number
    reservedQuantity: number
    availableStock: number
    daysOfStockLeft: number
    lowStockThreshold: number
    reorderQuantity: number
}

export interface SupplierPerformance {
    supplierId: string
    supplierName: string
    avgLeadTimeDays: number
    totalOrders: number
    onTimeDeliveryRate: number
}

export interface FinancialSnapshot {
    totalInventoryValue: number
    last30DaysRevenue: number
    last30DaysProfit: number
    availableCash: number
}

export async function calculateSalesVelocity(): Promise<SalesVelocity[]> {
    const supabase = await getSupabaseServer()

    const thirtyDaysAgo = subDays(new Date(), 30)
    const sixtyDaysAgo = subDays(new Date(), 60)

    // Get all products with their pricing
    const { data: products } = await supabase
        .from("products")
        .select("id, name, sku, selling_price, cost_price")
        .eq("is_active", true)

    if (!products) return []

    // Get sales for last 60 days
    const { data: orderItems } = await supabase
        .from("order_items")
        .select(`
      product_id,
      quantity,
      unit_price,
      cost_price,
      order:orders!inner(created_at, status)
    `)
        .gte("order.created_at", sixtyDaysAgo.toISOString())
        .in("order.status", ["completed", "layaway"])

    const velocityData: SalesVelocity[] = products.map((product) => {
        const productSales = orderItems?.filter((item: any) => item.product_id === product.id) || []

        const last30Days = productSales.filter((item: any) => {
            const orderDate = new Date(item.order.created_at)
            return orderDate >= thirtyDaysAgo
        })

        const last30DaysSales = last30Days.reduce((sum: number, item: any) => sum + item.quantity, 0)
        const last60DaysSales = productSales.reduce((sum: number, item: any) => sum + item.quantity, 0)

        const dailyAverage = last30DaysSales / 30

        // Calculate trend
        const first30DaysSales = last60DaysSales - last30DaysSales
        const first30DaysAvg = first30DaysSales / 30
        let trend: "up" | "down" | "stable" = "stable"

        if (dailyAverage > first30DaysAvg * 1.1) trend = "up"
        else if (dailyAverage < first30DaysAvg * 0.9) trend = "down"

        // Calculate profit margin
        const profitMargin =
            product.selling_price > 0 ? ((product.selling_price - product.cost_price) / product.selling_price) * 100 : 0

        return {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            last30DaysSales,
            last60DaysSales,
            dailyAverage,
            trend,
            profitMargin,
        }
    })

    return velocityData.filter((v) => v.last30DaysSales > 0 || v.last60DaysSales > 0)
}

export async function getInventoryStatus(): Promise<InventoryStatus[]> {
    const supabase = await getSupabaseServer()

    const { data: inventory } = await supabase.from("inventory").select(`
      product_id,
      quantity,
      reserved_quantity,
      product:products(
        id,
        name,
        low_stock_threshold,
        reorder_quantity
      )
    `)

    if (!inventory) return []

    // Calculate sales velocity for stock-out prediction
    const velocities = await calculateSalesVelocity()
    const velocityMap = new Map(velocities.map((v) => [v.productId, v.dailyAverage]))

    const statusData: InventoryStatus[] = []

    // Group by product
    const productMap = new Map<string, { stock: number; reserved: number; product: any }>()

    inventory.forEach((inv: any) => {
        const product = Array.isArray(inv.product) ? inv.product[0] : inv.product
        if (!product) return

        const existing = productMap.get(product.id)
        if (existing) {
            existing.stock += inv.quantity
            existing.reserved += inv.reserved_quantity
        } else {
            productMap.set(product.id, {
                stock: inv.quantity,
                reserved: inv.reserved_quantity,
                product,
            })
        }
    })

    productMap.forEach(({ stock, reserved, product }) => {
        const availableStock = stock - reserved
        const dailyVelocity = velocityMap.get(product.id) || 0
        const daysOfStockLeft = dailyVelocity > 0 ? availableStock / dailyVelocity : 999

        statusData.push({
            productId: product.id,
            productName: product.name,
            currentStock: stock,
            reservedQuantity: reserved,
            availableStock,
            daysOfStockLeft: Math.round(daysOfStockLeft),
            lowStockThreshold: product.low_stock_threshold || 10,
            reorderQuantity: product.reorder_quantity || 50,
        })
    })

    return statusData
}

export async function getSupplierPerformance(): Promise<SupplierPerformance[]> {
    const supabase = await getSupabaseServer()

    const { data: suppliers } = await supabase.from("suppliers").select("id, name").eq("is_active", true)

    if (!suppliers) return []

    const performanceData: SupplierPerformance[] = []

    for (const supplier of suppliers) {
        const { data: orders } = await supabase
            .from("purchase_orders")
            .select("sent_at, received_at, status")
            .eq("supplier_id", supplier.id)
            .not("sent_at", "is", null)

        const completedOrders = orders?.filter((o) => o.received_at) || []
        const totalOrders = orders?.length || 0

        let totalLeadTime = 0
        completedOrders.forEach((order) => {
            if (order.sent_at && order.received_at) {
                const sent = new Date(order.sent_at)
                const received = new Date(order.received_at)
                const leadTime = Math.ceil((received.getTime() - sent.getTime()) / (1000 * 60 * 60 * 24))
                totalLeadTime += leadTime
            }
        })

        const avgLeadTimeDays = completedOrders.length > 0 ? Math.round(totalLeadTime / completedOrders.length) : 7

        performanceData.push({
            supplierId: supplier.id,
            supplierName: supplier.name,
            avgLeadTimeDays,
            totalOrders,
            onTimeDeliveryRate: totalOrders > 0 ? (completedOrders.length / totalOrders) * 100 : 100,
        })
    }

    return performanceData
}

export async function getFinancialSnapshot(): Promise<FinancialSnapshot> {
    const supabase = await getSupabaseServer()

    // Get inventory value
    const { data: inventory } = await supabase.from("inventory").select(`
      quantity,
      product:products(cost_price)
    `)

    const totalInventoryValue =
        inventory?.reduce((sum, inv: any) => {
            const product = Array.isArray(inv.product) ? inv.product[0] : inv.product
            return sum + (product?.cost_price || 0) * inv.quantity
        }, 0) || 0

    // Get last 30 days revenue and profit
    const thirtyDaysAgo = subDays(new Date(), 30)

    const { data: orders } = await supabase
        .from("orders")
        .select(`
      total_amount,
      paid_amount,
      status,
      items:order_items(cost_price, quantity, unit_price)
    `)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .in("status", ["completed", "layaway"])

    let revenue = 0
    let cost = 0

    orders?.forEach((order: any) => {
        if (order.status === "completed") {
            revenue += order.total_amount || 0
        } else if (order.status === "layaway") {
            revenue += order.paid_amount || 0
        }

        const orderCost =
            order.items?.reduce((sum: number, item: any) => sum + item.cost_price * item.quantity, 0) || 0

        if (order.status === "layaway" && order.total_amount > 0) {
            const paymentRatio = (order.paid_amount || 0) / order.total_amount
            cost += orderCost * paymentRatio
        } else {
            cost += orderCost
        }
    })

    const profit = revenue - cost

    // Available cash = profit (simplified for now)
    // In production, this should come from actual accounting system
    const availableCash = profit * 0.7 // Assume 70% of profit can be reinvested

    return {
        totalInventoryValue,
        last30DaysRevenue: revenue,
        last30DaysProfit: profit,
        availableCash: Math.max(0, availableCash),
    }
}
