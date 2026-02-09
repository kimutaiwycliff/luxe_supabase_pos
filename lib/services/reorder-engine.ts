"use server"

import {
    calculateSalesVelocity,
    getInventoryStatus,
    getSupplierPerformance,
    getFinancialSnapshot,
} from "./reorder-analytics"
import { getAIReorderRecommendations, generateWeeklyReorderReport } from "./gemini-ai"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function generateReorderRecommendations() {
    try {
        // Step 1: Gather all analytics data
        const [salesVelocity, inventoryStatus, supplierPerformance, financials] = await Promise.all([
            calculateSalesVelocity(),
            getInventoryStatus(),
            getSupplierPerformance(),
            getFinancialSnapshot(),
        ])

        // Step 2: Get product details
        const supabase = await getSupabaseServer()
        const { data: products } = await supabase
            .from("products")
            .select(`
        id,
        name,
        sku,
        cost_price,
        selling_price,
        supplier:suppliers(id, name)
      `)
            .eq("is_active", true)

        if (!products) {
            return { success: false, error: "Failed to fetch products" }
        }

        // Step 3: Merge datasets for AI analysis
        const enrichedProducts = products.map((product: any) => {
            const velocity = salesVelocity.find((v) => v.productId === product.id)
            const inventory = inventoryStatus.find((i) => i.productId === product.id)
            const supplier = Array.isArray(product.supplier) ? product.supplier[0] : product.supplier
            const supplierPerf = supplier
                ? supplierPerformance.find((sp) => sp.supplierId === supplier.id)
                : undefined

            return {
                productId: product.id,
                productName: product.name,
                sku: product.sku,
                costPrice: product.cost_price,
                sellingPrice: product.selling_price,
                profitMargin: velocity?.profitMargin || 0,
                supplierId: supplier?.id || null,
                supplierName: supplier?.name || "Unknown",
                supplierLeadTime: supplierPerf?.avgLeadTimeDays || 7,
                currentStock: inventory?.availableStock || 0,
                reservedStock: inventory?.reservedQuantity || 0,
                daysOfStockLeft: inventory?.daysOfStockLeft || 999,
                dailySalesVelocity: velocity?.dailyAverage || 0,
                last30DaysSales: velocity?.last30DaysSales || 0,
                trend: velocity?.trend || "stable",
                lowStockThreshold: inventory?.lowStockThreshold || 10,
                reorderQuantity: inventory?.reorderQuantity || 50,
            }
        })

        // Step 4: Prepare data for AI
        const aiInputData = {
            salesHistory: salesVelocity.slice(0, 50), // Limit to top 50 products by sales
            inventory: inventoryStatus.slice(0, 50),
            suppliers: supplierPerformance,
            financials,
            products: enrichedProducts.slice(0, 50),
        }

        // Step 5: Get AI recommendations
        const aiResult = await getAIReorderRecommendations(aiInputData)

        if (!aiResult.success || !aiResult.data) {
            return { success: false, error: aiResult.error || "AI failed to generate recommendations" }
        }

        return {
            success: true,
            data: {
                recommendations: aiResult.data,
                metadata: {
                    generatedAt: new Date().toISOString(),
                    totalProducts: enrichedProducts.length,
                    availableBudget: financials.availableCash,
                    dataQuality: {
                        productsAnalyzed: enrichedProducts.length,
                        inventoryTracked: inventoryStatus.length,
                        suppliersActive: supplierPerformance.length,
                    },
                },
            },
        }
    } catch (error) {
        console.error("Error generating reorder recommendations:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        }
    }
}

export async function generateWeeklyReport() {
    try {
        // Gather all analytics data
        const [salesVelocity, inventoryStatus, supplierPerformance, financials] = await Promise.all([
            calculateSalesVelocity(),
            getInventoryStatus(),
            getSupplierPerformance(),
            getFinancialSnapshot(),
        ])

        // Get product details
        const supabase = await getSupabaseServer()
        const { data: products } = await supabase
            .from("products")
            .select(`
        id,
        name,
        sku,
        cost_price,
        selling_price,
        supplier:suppliers(id, name)
      `)
            .eq("is_active", true)

        if (!products) {
            return { success: false, error: "Failed to fetch products" }
        }

        // Calculate week dates
        const endDate = new Date()
        const startDate = new Date(endDate)
        startDate.setDate(startDate.getDate() - 7)

        const reportData = {
            salesHistory: salesVelocity,
            inventory: inventoryStatus,
            suppliers: supplierPerformance,
            financials,
            products: products.map((p: any) => ({
                id: p.id,
                name: p.name,
                sku: p.sku,
                costPrice: p.cost_price,
                sellingPrice: p.selling_price,
                supplier: Array.isArray(p.supplier) ? p.supplier[0] : p.supplier,
            })),
            weekStartDate: startDate.toISOString().split("T")[0],
            weekEndDate: endDate.toISOString().split("T")[0],
        }

        // Generate AI report
        const reportResult = await generateWeeklyReorderReport(reportData)

        if (!reportResult.success || !reportResult.report) {
            return { success: false, error: reportResult.error || "Failed to generate report" }
        }

        // Save report to database
        const { data: savedReport, error: saveError } = await supabase
            .from("reorder_reports")
            .insert({
                report_date: endDate.toISOString(),
                week_start: startDate.toISOString(),
                week_end: endDate.toISOString(),
                report_content: reportResult.report,
                metadata: {
                    totalProducts: products.length,
                    availableBudget: financials.availableCash,
                    totalRevenue: financials.last30DaysRevenue,
                    totalProfit: financials.last30DaysProfit,
                },
            })
            .select()
            .single()

        if (saveError) {
            console.error("Failed to save report:", saveError)
            // Return report even if save fails
            return { success: true, report: reportResult.report, saved: false }
        }

        return { success: true, report: reportResult.report, reportId: savedReport.id, saved: true }
    } catch (error) {
        console.error("Error generating weekly report:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        }
    }
}
