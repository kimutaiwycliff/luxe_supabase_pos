"use client"

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { formatCurrency } from "@/lib/format"

interface SalesChartProps {
  data: { date: string; revenue: number; orders: number }[]
}

export function SalesChart({ data }: SalesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">No sales data available</div>
    )
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" stroke="hsl(0, 0%, 60%)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            stroke="hsl(0, 0%, 60%)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value / 1000}k`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                    <p className="text-sm font-medium text-foreground">{formatCurrency(payload[0].value as number)}</p>
                    <p className="text-xs text-muted-foreground">{payload[0].payload.orders} orders</p>
                  </div>
                )
              }
              return null
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="hsl(142, 71%, 45%)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
