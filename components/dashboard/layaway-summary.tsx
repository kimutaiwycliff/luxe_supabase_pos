"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/format"
import { BookMarked, Phone, Calendar, AlertTriangle } from "lucide-react"
import Link from "next/link"
import type { LayawayOrderSummary } from "@/lib/actions/dashboard"

interface LayawaySummaryProps {
  layaways: LayawayOrderSummary[]
  stats: {
    totalLayaways: number;
    totalReservedValue: number;
    totalCollected: number;
    totalPending: number;
    overdueCount: number;
  } | null | undefined;
}

export function LayawaySummary({ layaways, stats }: LayawaySummaryProps) {
  if (!stats || stats.totalLayaways === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookMarked className="h-5 w-5" />
            Layaway Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BookMarked className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No active layaway orders</p>
            <p className="text-xs text-muted-foreground mt-1">
              Layaway orders will appear here when customers reserve products
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <BookMarked className="h-5 w-5" />
          Layaway Orders
          {stats.overdueCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {stats.overdueCount} overdue
            </Badge>
          )}
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/layaways">View All</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-3 rounded-lg bg-muted p-3 text-sm">
          <div className="text-center">
            <p className="text-muted-foreground">Reserved</p>
            <p className="font-semibold">{formatCurrency(stats.totalReservedValue)}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Collected</p>
            <p className="font-semibold text-success">{formatCurrency(stats.totalCollected)}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Pending</p>
            <p className="font-semibold text-warning">{formatCurrency(stats.totalPending)}</p>
          </div>
        </div>

        {/* Recent layaways */}
        <div className="space-y-3">
          {layaways.map((layaway) => (
            <div
              key={layaway.id}
              className={`flex items-center justify-between rounded-lg border p-3 ${layaway.is_overdue ? "border-destructive/50 bg-destructive/5" : ""
                }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{layaway.customer_name}</span>
                  {layaway.is_overdue && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Overdue
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {layaway.customer_phone}
                  </span>
                  {layaway.due_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(layaway.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-xs">
                  {layaway.items_count} item{layaway.items_count !== 1 ? "s" : ""} • {layaway.order_number}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(layaway.balance)}</p>
                <p className="text-xs text-muted-foreground">balance</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
