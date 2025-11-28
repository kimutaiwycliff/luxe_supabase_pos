"use client"

import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, LayoutDashboard, Store, ScanBarcode } from "lucide-react"
import useSWR from "swr"
import { getTodayStats } from "@/lib/actions/orders"
import { formatCurrency } from "@/lib/format"

interface POSHeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function POSHeader({ searchQuery, onSearchChange }: POSHeaderProps) {
  const { data: stats } = useSWR(
    "today-stats",
    async () => {
      const result = await getTodayStats()
      return result
    },
    { refreshInterval: 30000 },
  ) // Refresh every 30 seconds

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Store className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold">Boutique POS</span>
        </Link>

        <div className="ml-8 flex items-center gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Today&apos;s Sales</span>
            <p className="font-semibold text-success">{formatCurrency(stats?.revenue || 0)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Orders</span>
            <p className="font-semibold">{stats?.orders || 0}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products or scan barcode..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
          <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2">
            <ScanBarcode className="h-4 w-4" />
          </Button>
        </div>

        <Button variant="outline" asChild>
          <Link href="/">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      </div>
    </header>
  )
}
