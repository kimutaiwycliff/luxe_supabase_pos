"use client"

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts"
import { formatCurrency } from "@/lib/format"
import type { SupplierSales } from "@/lib/actions/analytics"

interface SupplierChartProps {
    data: SupplierSales[]
}

const COLORS = [
    "hsl(142, 71%, 45%)",
    "hsl(200, 100%, 50%)",
    "hsl(280, 100%, 70%)",
    "hsl(38, 92%, 50%)",
    "hsl(0, 84%, 60%)",
    "hsl(180, 70%, 50%)",
]

export function SupplierChart({ data }: SupplierChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex h-[300px] items-center justify-center">
                <p className="text-muted-foreground">No supplier data</p>
            </div>
        )
    }

    const chartData = data.slice(0, 6).map((item) => ({
        ...item,
        supplier: item.supplier.length > 12 ? item.supplier.substring(0, 12) + "..." : item.supplier,
    }))

    return (
        <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                    <XAxis
                        type="number"
                        stroke="hsl(0, 0%, 60%)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                    />
                    <YAxis
                        type="category"
                        dataKey="supplier"
                        stroke="hsl(0, 0%, 60%)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        width={80}
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                                        <p className="text-sm font-medium text-foreground">{payload[0].payload.supplier}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Revenue: {formatCurrency(payload[0].value as number)}
                                        </p>
                                        <p className="text-sm text-muted-foreground">Items sold: {payload[0].payload.quantity}</p>
                                    </div>
                                )
                            }
                            return null
                        }}
                    />
                    <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                        {chartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
