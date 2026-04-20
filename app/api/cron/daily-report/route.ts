import { NextResponse } from "next/server"
import { subDays, format } from "date-fns"
import { getSalesAnalytics, getPaymentBreakdown, getTopProducts, getCategorySales } from "@/lib/actions/analytics"
import { sendDailyReport } from "@/lib/services/email"

const REPORT_EMAIL = "kimtaiwiki@gmail.com"

export async function GET(request: Request) {
  // Verify the request is from Vercel cron (or authorized manually)
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Yesterday's date range
    const yesterday = subDays(new Date(), 1)
    const dateFrom = new Date(yesterday)
    dateFrom.setHours(0, 0, 0, 0)
    const dateTo = new Date(yesterday)
    dateTo.setHours(23, 59, 59, 999)

    // Day before yesterday for comparison
    const dayBefore = subDays(yesterday, 1)
    const compareDateFrom = new Date(dayBefore)
    compareDateFrom.setHours(0, 0, 0, 0)
    const compareDateTo = new Date(dayBefore)
    compareDateTo.setHours(23, 59, 59, 999)

    const dateFromISO = dateFrom.toISOString()
    const dateToISO = dateTo.toISOString()
    const compareDateFromISO = compareDateFrom.toISOString()
    const compareDateToISO = compareDateTo.toISOString()

    // Fetch all analytics in parallel
    const [analyticsResult, paymentsResult, topProductsResult, categorySalesResult] = await Promise.all([
      getSalesAnalytics(dateFromISO, dateToISO, compareDateFromISO, compareDateToISO),
      getPaymentBreakdown(dateFromISO, dateToISO),
      getTopProducts(dateFromISO, dateToISO, 10),
      getCategorySales(dateFromISO, dateToISO),
    ])

    if (analyticsResult.error || !analyticsResult.data) {
      return NextResponse.json({ error: `Analytics error: ${analyticsResult.error}` }, { status: 500 })
    }

    const reportDate = format(yesterday, "EEEE, MMMM d, yyyy")

    const result = await sendDailyReport(
      {
        reportDate,
        analytics: analyticsResult.data,
        payments: paymentsResult.data ?? { cash: 0, mpesa: 0, card: 0, other: 0 },
        topProducts: topProductsResult.data ?? [],
        categorySales: categorySalesResult.data ?? [],
      },
      REPORT_EMAIL,
    )

    if (!result.success) {
      return NextResponse.json({ error: `Email error: ${result.error}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, reportDate, sentTo: REPORT_EMAIL })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
