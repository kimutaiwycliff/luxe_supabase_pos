"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatCurrency, formatNumber, formatDate } from "@/lib/format"
import { DollarSign, ShoppingCart, TrendingUp, Receipt, CalendarIcon } from "lucide-react"
import {
  getSalesAnalytics,
  getPaymentBreakdown,
  getTopProducts,
  getSalesTrend,
  getCategorySales,
} from "@/lib/actions/analytics"
import { RevenueChart } from "./revenue-chart"
import { PaymentChart } from "./payment-chart"
import { TopProductsTable } from "./top-products-table"
import { CategoryChart } from "./category-chart"
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { cn } from "@/lib/utils"
import type { DateRange } from "react-day-picker"

type DatePreset = "today" | "yesterday" | "7days" | "30days" | "thisMonth" | "lastMonth" | "custom"

export function AnalyticsContent() {
  const [datePreset, setDatePreset] = useState<DatePreset>("30days")
  const [customRange, setCustomRange] = useState<DateRange | undefined>()
  const [calendarOpen, setCalendarOpen] = useState(false)

  const { dateFrom, dateTo, compareDateFrom, compareDateTo } = useMemo(() => {
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    let from: Date, to: Date, compareFrom: Date, compareTo: Date

    switch (datePreset) {
      case "today":
        from = new Date(today)
        from.setHours(0, 0, 0, 0)
        to = today
        compareFrom = subDays(from, 1)
        compareTo = subDays(to, 1)
        break
      case "yesterday":
        to = subDays(today, 1)
        to.setHours(23, 59, 59, 999)
        from = new Date(to)
        from.setHours(0, 0, 0, 0)
        compareFrom = subDays(from, 1)
        compareTo = subDays(to, 1)
        break
      case "7days":
        from = subDays(today, 6)
        from.setHours(0, 0, 0, 0)
        to = today
        compareFrom = subDays(from, 7)
        compareTo = subDays(to, 7)
        break
      case "thisMonth":
        from = startOfMonth(today)
        to = today
        const lastMonth = subMonths(today, 1)
        compareFrom = startOfMonth(lastMonth)
        compareTo = endOfMonth(lastMonth)
        break
      case "lastMonth":
        const prevMonth = subMonths(today, 1)
        from = startOfMonth(prevMonth)
        to = endOfMonth(prevMonth)
        const twoMonthsAgo = subMonths(today, 2)
        compareFrom = startOfMonth(twoMonthsAgo)
        compareTo = endOfMonth(twoMonthsAgo)
        break
      case "custom":
        from = customRange?.from || subDays(today, 29)
        to = customRange?.to || today
        const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
        compareFrom = subDays(from, daysDiff)
        compareTo = subDays(to, daysDiff)
        break
      default: // 30days
        from = subDays(today, 29)
        from.setHours(0, 0, 0, 0)
        to = today
        compareFrom = subDays(from, 30)
        compareTo = subDays(to, 30)
    }

    return {
      dateFrom: from.toISOString(),
      dateTo: to.toISOString(),
      compareDateFrom: compareFrom.toISOString(),
      compareDateTo: compareTo.toISOString(),
    }
  }, [datePreset, customRange])

  const { data: analytics } = useSWR(["analytics", dateFrom, dateTo], async () => {
    const result = await getSalesAnalytics(dateFrom, dateTo, compareDateFrom, compareDateTo)
    return result.data
  })

  const { data: paymentData } = useSWR(["payments", dateFrom, dateTo], async () => {
    const result = await getPaymentBreakdown(dateFrom, dateTo)
    return result.data
  })

  const { data: topProducts } = useSWR(["top-products", dateFrom, dateTo], async () => {
    const result = await getTopProducts(dateFrom, dateTo, 10)
    return result.data
  })

  const { data: salesTrend } = useSWR(["sales-trend", dateFrom, dateTo], async () => {
    const result = await getSalesTrend(dateFrom, dateTo, "day")
    return result.data
  })

  const { data: categorySales } = useSWR(["category-sales", dateFrom, dateTo], async () => {
    const result = await getCategorySales(dateFrom, dateTo)
    return result.data
  })

  const handleDatePresetChange = (value: string) => {
    setDatePreset(value as DatePreset)
    if (value !== "custom") {
      setCustomRange(undefined)
    }
  }

  return (
    <div className="p-6">
      {/* Date Filter */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Select value={datePreset} onValueChange={handleDatePresetChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="thisMonth">This Month</SelectItem>
            <SelectItem value="lastMonth">Last Month</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>

        {datePreset === "custom" && (
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customRange?.from ? (
                  customRange.to ? (
                    <>
                      {format(customRange.from, "LLL dd, y")} - {format(customRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(customRange.from, "LLL dd, y")
                  )
                ) : (
                  "Pick a date range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={customRange?.from}
                selected={customRange}
                onSelect={(range) => {
                  setCustomRange(range)
                  if (range?.from && range?.to) {
                    setCalendarOpen(false)
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        )}

        <span className="text-sm text-muted-foreground">
          {formatDate(dateFrom)} - {formatDate(dateTo)}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(analytics?.totalRevenue || 0)}
          change={analytics?.revenueChange}
          changeLabel="vs prev period"
          icon={DollarSign}
        />
        <StatCard
          title="Total Orders"
          value={formatNumber(analytics?.totalOrders || 0)}
          change={analytics?.ordersChange}
          changeLabel="vs prev period"
          icon={ShoppingCart}
        />
        <StatCard
          title="Total Profit"
          value={formatCurrency(analytics?.totalProfit || 0)}
          change={analytics?.profitChange}
          changeLabel="vs prev period"
          icon={TrendingUp}
        />
        <StatCard
          title="Avg Order Value"
          value={formatCurrency(analytics?.avgOrderValue || 0)}
          change={analytics?.avgOrderChange}
          changeLabel="vs prev period"
          icon={Receipt}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={salesTrend || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentChart data={paymentData} />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <TopProductsTable products={topProducts || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryChart data={categorySales || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
