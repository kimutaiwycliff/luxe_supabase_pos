"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { formatCurrency } from "@/lib/format"
import type { PaymentBreakdown } from "@/lib/actions/analytics"

interface PaymentChartProps {
  data: PaymentBreakdown | null | undefined
}

const COLORS = [
  "hsl(142, 71%, 45%)", // Cash - Green
  "hsl(200, 100%, 50%)", // M-Pesa - Blue
  "hsl(280, 100%, 70%)", // Card - Purple
  "hsl(0, 0%, 50%)", // Other - Gray
]

export function PaymentChart({ data }: PaymentChartProps) {
  if (!data) {
    return (
      <div className="flex h-[250px] items-center justify-center">
        <p className="text-muted-foreground">No payment data</p>
      </div>
    )
  }

  const chartData = [
    { name: "Cash", value: data.cash },
    { name: "M-Pesa", value: data.mpesa },
    { name: "Card", value: data.card },
    { name: "Other", value: data.other },
  ].filter((item) => item.value > 0)

  if (chartData.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center">
        <p className="text-muted-foreground">No payment data</p>
      </div>
    )
  }

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0]
                const percent = (((item.value as number) / total) * 100).toFixed(1)
                return (
                  <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.value as number)} ({percent}%)
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Legend formatter={(value) => <span className="text-sm text-foreground">{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
