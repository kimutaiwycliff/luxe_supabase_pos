import { Suspense } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { ReportsViewer } from "@/components/reorder/reports-viewer"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
    title: "Reorder Reports | Luxe Collections",
    description: "AI-generated weekly reorder insights and recommendations",
}

function ReportsSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-40" />
            <div className="grid gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-lg" />
                ))}
            </div>
        </div>
    )
}

export default function ReportsPage() {
    return (
        <>
            <PageHeader
                title="Reorder Reports"
                breadcrumbs={[
                    { label: "Inventory", href: "/inventory" },
                    { label: "Smart Reorder", href: "/reorder" },
                    { label: "Reports" },
                ]}
            />
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                <Suspense fallback={<ReportsSkeleton />}>
                    <ReportsViewer />
                </Suspense>
            </div>
        </>
    )
}
