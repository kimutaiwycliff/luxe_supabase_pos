"use client"
import { formatCurrency } from "@/lib/format"
import { DollarSign, ShoppingCart, Package, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { RecentOrdersTable } from "./recent-orders-table"
import { LowStockAlert } from "./low-stock-alert"
import { SalesChart } from "./sales-chart"
import { StatCard } from "../ui/stat-card"

// Demo data - will be replaced with real data from Supabase
const stats = {
  todayRevenue: 45680,
  todayOrders: 23,
  totalProducts: 156,
  profit: 12450,
  revenueChange: 12.5,
  ordersChange: 8.2,
  productsChange: 3.1,
  profitChange: 15.3,
}

export function DashboardContent() {
  return (
    <div className="p-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(stats.todayRevenue)}
          change={stats.revenueChange}
          changeLabel="vs yesterday"
          icon={DollarSign}
        />
        <StatCard
          title="Today's Orders"
          value={stats.todayOrders}
          change={stats.ordersChange}
          changeLabel="vs yesterday"
          icon={ShoppingCart}
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          change={stats.productsChange}
          changeLabel="this week"
          icon={Package}
        />
        <StatCard
          title="Today's Profit"
          value={formatCurrency(stats.profit)}
          change={stats.profitChange}
          changeLabel="vs yesterday"
          icon={TrendingUp}
        />
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
            <SalesChart />
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
            <LowStockAlert />
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
          <RecentOrdersTable />
        </CardContent>
      </Card>
    </div>
  )
}
