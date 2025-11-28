import { Skeleton } from "@/components/ui/skeleton"

export function LayoutSkeleton() {
  return (
    <div className="flex h-screen w-full">
      {/* Sidebar skeleton */}
      <div className="hidden md:flex h-full w-64 flex-col border-r bg-sidebar">
        {/* Header */}
        <div className="flex h-14 items-center gap-3 border-b px-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>

        {/* Navigation groups */}
        <div className="flex-1 space-y-6 p-4">
          {/* Main group */}
          <div className="space-y-2">
            <Skeleton className="h-3 w-12" />
            <div className="space-y-1">
              <Skeleton className="h-8 w-full rounded-md" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
          </div>

          {/* Inventory group */}
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <div className="space-y-1">
              <Skeleton className="h-8 w-full rounded-md" />
              <Skeleton className="h-8 w-full rounded-md" />
              <Skeleton className="h-8 w-full rounded-md" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
          </div>

          {/* Operations group */}
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <div className="space-y-1">
              <Skeleton className="h-8 w-full rounded-md" />
              <Skeleton className="h-8 w-full rounded-md" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
          </div>

          {/* Reports group */}
          <div className="space-y-2">
            <Skeleton className="h-3 w-14" />
            <div className="space-y-1">
              <Skeleton className="h-8 w-full rounded-md" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex h-14 items-center gap-4 border-b px-6">
          <Skeleton className="h-6 w-6 md:hidden" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-lg border p-4 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>

          {/* Chart area */}
          <div className="rounded-lg border p-4 space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
