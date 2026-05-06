"use client"

import Link from "next/link"
import useSWR from "swr"
import { ListChecks, Circle, Clock, CheckCircle2, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getActiveRestockList } from "@/lib/actions/restock-lists"

export function RestockWidget() {
  const { data, isLoading } = useSWR("dashboard-restock-list", async () => {
    const { list } = await getActiveRestockList()
    return list
  })

  const items = data?.items ?? []
  const pending = items.filter((i) => i.status === "pending").length
  const ordered = items.filter((i) => i.status === "ordered").length
  const received = items.filter((i) => i.status === "received").length
  const total = items.length
  const progress = total > 0 ? Math.round((received / total) * 100) : 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ListChecks className="h-5 w-5 text-teal-500" />
          Restock List
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/restock" className="flex items-center gap-1">
            Open
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : total === 0 ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-sm text-muted-foreground">No active restock list</p>
            <Button size="sm" asChild>
              <Link href="/restock">Create List</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {data?.name && (
              <p className="text-sm font-medium truncate text-foreground">{data.name}</p>
            )}

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{received} of {total} received</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-teal-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Status counts */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-2">
                <Circle className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-bold leading-none">{pending}</span>
                <span className="text-[10px] text-muted-foreground">Pending</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-lg bg-amber-50 dark:bg-amber-950/20 p-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-lg font-bold leading-none text-amber-600 dark:text-amber-400">{ordered}</span>
                <span className="text-[10px] text-muted-foreground">Ordered</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-lg bg-green-50 dark:bg-green-950/20 p-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-lg font-bold leading-none text-green-600 dark:text-green-400">{received}</span>
                <span className="text-[10px] text-muted-foreground">Received</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
