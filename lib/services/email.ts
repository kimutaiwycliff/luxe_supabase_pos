import { Resend } from "resend"
import type { SalesAnalytics, PaymentBreakdown, TopProduct, CategorySales } from "@/lib/actions/analytics"

const resend = new Resend(process.env.RESEND_API_KEY)

function formatKES(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function changeArrow(change: number): string {
  if (change > 0) return `&#9650; ${change.toFixed(1)}%`
  if (change < 0) return `&#9660; ${Math.abs(change).toFixed(1)}%`
  return `&#8212; 0%`
}

function changeColor(change: number): string {
  if (change > 0) return "#16a34a"
  if (change < 0) return "#dc2626"
  return "#6b7280"
}

export interface DailyReportData {
  reportDate: string
  analytics: SalesAnalytics
  payments: PaymentBreakdown
  topProducts: TopProduct[]
  categorySales: CategorySales[]
}

function buildHtml(data: DailyReportData): string {
  const { reportDate, analytics, payments, topProducts, categorySales } = data

  const topProductsRows = topProducts
    .slice(0, 10)
    .map(
      (p, i) => `
      <tr style="border-bottom:1px solid #f3f4f6;">
        <td style="padding:10px 12px;color:#374151;font-size:13px;">${i + 1}</td>
        <td style="padding:10px 12px;">
          <div style="font-weight:600;color:#111827;font-size:13px;">${p.name}</div>
          <div style="color:#9ca3af;font-size:11px;">${p.sku}</div>
        </td>
        <td style="padding:10px 12px;text-align:center;color:#374151;font-size:13px;">${p.quantity_sold}</td>
        <td style="padding:10px 12px;text-align:right;font-weight:600;color:#111827;font-size:13px;">${formatKES(p.revenue)}</td>
        <td style="padding:10px 12px;text-align:right;color:#16a34a;font-size:13px;">${formatKES(p.profit)}</td>
      </tr>`,
    )
    .join("")

  const categoryRows = categorySales
    .slice(0, 6)
    .map(
      (c) => `
      <tr style="border-bottom:1px solid #f3f4f6;">
        <td style="padding:10px 12px;color:#111827;font-size:13px;font-weight:500;">${c.category}</td>
        <td style="padding:10px 12px;text-align:center;color:#374151;font-size:13px;">${c.quantity}</td>
        <td style="padding:10px 12px;text-align:right;font-weight:600;color:#111827;font-size:13px;">${formatKES(c.revenue)}</td>
      </tr>`,
    )
    .join("")

  const totalPayments = payments.cash + payments.mpesa + payments.card + payments.other
  const paymentBar = (amount: number, color: string, label: string) => {
    const pct = totalPayments > 0 ? Math.round((amount / totalPayments) * 100) : 0
    if (pct === 0) return ""
    return `
    <div style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="font-size:13px;color:#374151;">${label}</span>
        <span style="font-size:13px;font-weight:600;color:#111827;">${formatKES(amount)} <span style="color:#9ca3af;font-weight:400;">(${pct}%)</span></span>
      </div>
      <div style="background:#f3f4f6;border-radius:4px;height:8px;overflow:hidden;">
        <div style="background:${color};width:${pct}%;height:100%;border-radius:4px;"></div>
      </div>
    </div>`
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Sales Report - ${reportDate}</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:620px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:32px 40px;">
      <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Daily Sales Report</div>
      <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;">${reportDate}</h1>
      <p style="margin:8px 0 0;font-size:14px;color:#cbd5e1;">Yesterday's performance summary</p>
    </div>

    <!-- Key Metrics -->
    <div style="padding:32px 40px 0;">
      <h2 style="margin:0 0 20px;font-size:15px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Key Metrics</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;">
          <div style="font-size:12px;color:#64748b;margin-bottom:6px;">Total Revenue</div>
          <div style="font-size:22px;font-weight:700;color:#0f172a;">${formatKES(analytics.totalRevenue)}</div>
          <div style="margin-top:6px;font-size:12px;color:${changeColor(analytics.revenueChange)};">${changeArrow(analytics.revenueChange)} vs prev day</div>
        </div>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;">
          <div style="font-size:12px;color:#64748b;margin-bottom:6px;">Total Orders</div>
          <div style="font-size:22px;font-weight:700;color:#0f172a;">${analytics.totalOrders}</div>
          <div style="margin-top:6px;font-size:12px;color:${changeColor(analytics.ordersChange)};">${changeArrow(analytics.ordersChange)} vs prev day</div>
        </div>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;">
          <div style="font-size:12px;color:#64748b;margin-bottom:6px;">Total Profit</div>
          <div style="font-size:22px;font-weight:700;color:#0f172a;">${formatKES(analytics.totalProfit)}</div>
          <div style="margin-top:6px;font-size:12px;color:${changeColor(analytics.profitChange)};">${changeArrow(analytics.profitChange)} vs prev day</div>
        </div>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;">
          <div style="font-size:12px;color:#64748b;margin-bottom:6px;">Avg Order Value</div>
          <div style="font-size:22px;font-weight:700;color:#0f172a;">${formatKES(analytics.avgOrderValue)}</div>
          <div style="margin-top:6px;font-size:12px;color:${changeColor(analytics.avgOrderChange)};">${changeArrow(analytics.avgOrderChange)} vs prev day</div>
        </div>

      </div>
    </div>

    <!-- Payment Breakdown -->
    <div style="padding:28px 40px 0;">
      <h2 style="margin:0 0 20px;font-size:15px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Payment Methods</h2>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;">
        ${paymentBar(payments.cash, "#3b82f6", "Cash")}
        ${paymentBar(payments.mpesa, "#10b981", "M-Pesa")}
        ${paymentBar(payments.card, "#8b5cf6", "Card")}
        ${paymentBar(payments.other, "#f59e0b", "Other")}
        ${totalPayments === 0 ? '<p style="color:#9ca3af;font-size:13px;margin:0;">No payments recorded.</p>' : ""}
      </div>
    </div>

    <!-- Top Products -->
    ${
      topProducts.length > 0
        ? `<div style="padding:28px 40px 0;">
      <h2 style="margin:0 0 20px;font-size:15px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Top Products Sold</h2>
      <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:10px 12px;text-align:left;font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:600;">#</th>
              <th style="padding:10px 12px;text-align:left;font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:600;">Product</th>
              <th style="padding:10px 12px;text-align:center;font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:600;">Qty</th>
              <th style="padding:10px 12px;text-align:right;font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:600;">Revenue</th>
              <th style="padding:10px 12px;text-align:right;font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:600;">Profit</th>
            </tr>
          </thead>
          <tbody>${topProductsRows}</tbody>
        </table>
      </div>
    </div>`
        : ""
    }

    <!-- Category Sales -->
    ${
      categorySales.length > 0
        ? `<div style="padding:28px 40px 0;">
      <h2 style="margin:0 0 20px;font-size:15px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Sales by Category</h2>
      <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:10px 12px;text-align:left;font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:600;">Category</th>
              <th style="padding:10px 12px;text-align:center;font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:600;">Units Sold</th>
              <th style="padding:10px 12px;text-align:right;font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:600;">Revenue</th>
            </tr>
          </thead>
          <tbody>${categoryRows}</tbody>
        </table>
      </div>
    </div>`
        : ""
    }

    <!-- Insight Block -->
    <div style="padding:28px 40px 0;">
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:20px;">
        <div style="font-size:13px;font-weight:600;color:#1d4ed8;margin-bottom:8px;">&#128161; Quick Insight</div>
        <p style="margin:0;font-size:13px;color:#1e40af;line-height:1.6;">
          ${
            analytics.totalOrders === 0
              ? "No orders were recorded yesterday. Consider reviewing staffing, marketing, or store hours."
              : analytics.revenueChange >= 10
                ? `Great day! Revenue is up <strong>${analytics.revenueChange.toFixed(1)}%</strong> compared to the previous day. ${topProducts[0] ? `<strong>${topProducts[0].name}</strong> was your top performer.` : ""}`
                : analytics.revenueChange <= -10
                  ? `Revenue dropped <strong>${Math.abs(analytics.revenueChange).toFixed(1)}%</strong> vs the previous day. It may be worth investigating if there were any operational issues.`
                  : `Sales are steady. ${topProducts[0] ? `Your top product was <strong>${topProducts[0].name}</strong> with ${topProducts[0].quantity_sold} units sold.` : ""}`
          }
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:28px 40px 32px;">
      <div style="border-top:1px solid #f3f4f6;padding-top:24px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">This report was automatically generated at midnight for ${reportDate}.</p>
        <p style="margin:6px 0 0;font-size:12px;color:#9ca3af;">Supabase POS &mdash; Daily Analytics</p>
      </div>
    </div>

  </div>
</body>
</html>`
}

export async function sendDailyReport(data: DailyReportData, to: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: "POS Reports <reports@wycliffkimutai.co.ke>",
      to,
      subject: `Daily Sales Report — ${data.reportDate}`,
      html: buildHtml(data),
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}
