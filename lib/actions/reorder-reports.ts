"use server"

import { getSupabaseServer } from "@/lib/supabase/server"

export interface ReorderReport {
    id: string
    report_date: string
    week_start: string
    week_end: string
    report_content: string
    metadata: {
        totalProducts?: number
        availableBudget?: number
        totalRevenue?: number
        totalProfit?: number
    }
    created_at: string
    updated_at: string
}

export async function getReorderReports(limit = 10) {
    const supabase = await getSupabaseServer()

    const { data, error } = await supabase
        .from("reorder_reports")
        .select("*")
        .order("report_date", { ascending: false })
        .limit(limit)

    if (error) {
        console.error("Error fetching reorder reports:", error)
        return { reports: [], error: error.message }
    }

    return { reports: data as ReorderReport[], error: null }
}

export async function getReorderReport(id: string) {
    const supabase = await getSupabaseServer()

    const { data, error } = await supabase
        .from("reorder_reports")
        .select("*")
        .eq("id", id)
        .single()

    if (error) {
        console.error("Error fetching reorder report:", error)
        return { report: null, error: error.message }
    }

    return { report: data as ReorderReport, error: null }
}

export async function deleteReorderReport(id: string) {
    const supabase = await getSupabaseServer()

    const { error } = await supabase
        .from("reorder_reports")
        .delete()
        .eq("id", id)

    if (error) {
        console.error("Error deleting reorder report:", error)
        return { success: false, error: error.message }
    }

    return { success: true, error: null }
}
