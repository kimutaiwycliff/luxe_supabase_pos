"use client"

import { StatCard } from "@/components/ui/stat-card"
import { formatCurrency } from "@/lib/format"
import { DollarSign, ShoppingCart, Package, TrendingUp, AlertTriangle, ArrowRight, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { RecentOrdersTable } from "./recent-orders-table"
import { LowStockAlert } from "./low-stock-alert"
import { SalesChart } from "./sales-chart"
import useSWR from "swr"
import {
  getDashboardStats,
  getWeeklySales,
  getLowStockItems,
  getRecentOrdersForDashboard,
} from "@/lib/actions/dashboard"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardContent() {
  const {
    data: statsData,
    isLoading: statsLoading,
    mutate: mutateStats,
  } = useSWR("dashboard-stats", async () => getDashboardStats())

  const { data: salesData, isLoading: salesLoading } = useSWR("weekly-sales", async () => getWeeklySales())

  const { data: lowStockData, isLoading: lowStockLoading } = useSWR("low-stock-items", async () => getLowStockItems(5))

  const {
    data: ordersData,
    isLoading: ordersLoading,
    mutate: mutateOrders,
  } = useSWR("recent-orders-dashboard", async () => getRecentOrdersForDashboard(5))

  const stats = statsData?.data
  const salesChartData = salesData?.data || []
  const lowStockItems = lowStockData?.data || []
  const recentOrders = ordersData?.orders || []

  const handleRefresh = () => {
    mutateStats()
    mutateOrders()
  }

  return (
    <div className="p-6">
      {/* Stats Grid */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Overview</h2>
        <Button variant="ghost" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Today's Revenue"
              value={formatCurrency(stats?.todayRevenue || 0)}
              change={stats?.revenueChange || 0}
              changeLabel="vs yesterday"
              icon={DollarSign}
            />
            <StatCard
              title="Today's Orders"
              value={stats?.todayOrders || 0}
              change={stats?.ordersChange || 0}
              changeLabel="vs yesterday"
              icon={ShoppingCart}
            />
            <StatCard
              title="Total Products"
              value={stats?.totalProducts || 0}
              change={stats?.productsChange || 0}
              changeLabel="this week"
              icon={Package}
            />
            <StatCard
              title="Today's Profit"
              value={formatCurrency(stats?.todayProfit || 0)}
              change={stats?.profitChange || 0}
              changeLabel="vs yesterday"
              icon={TrendingUp}
            />
          </>
        )}
      </div>

      {/* Charts and Tables */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Sales Overview</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/analytics" className="flex items-center gap-1">
                View Details
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {salesLoading ? <Skeleton className="h-[300px] w-full" /> : <SalesChart data={salesChartData} />}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Low Stock Alerts
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/low-stock">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {lowStockLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <LowStockAlert items={lowStockItems} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/pos" className="flex items-center gap-1">
              New Sale
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {ordersLoading ? <Skeleton className="h-64 w-full" /> : <RecentOrdersTable orders={recentOrders} />}
        </CardContent>
      </Card>
    </div>
  )
}
