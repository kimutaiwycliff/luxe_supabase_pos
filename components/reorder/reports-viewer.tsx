"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { FileText, Download, Trash2, Calendar, TrendingUp, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getReorderReports, deleteReorderReport, type ReorderReport } from "@/lib/actions/reorder-reports"
import { generateWeeklyReport } from "@/lib/services/reorder-engine"
import { formatCurrency } from "@/lib/format"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"

export function ReportsViewer() {
    const [reports, setReports] = useState<ReorderReport[]>([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [selectedReport, setSelectedReport] = useState<ReorderReport | null>(null)

    const loadReports = async () => {
        setLoading(true)
        try {
            const { reports: data, error } = await getReorderReports(20)
            if (error) {
                toast.error("Failed to load reports")
            } else {
                setReports(data)
            }
        } catch (error) {
            console.error("Failed to load reports:", error)
            toast.error("Failed to load reports")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadReports()
    }, [])

    const handleGenerateReport = async () => {
        setGenerating(true)
        try {
            const result = await generateWeeklyReport()
            if (result.success) {
                toast.success("Weekly report generated successfully")
                loadReports()
            } else {
                toast.error(result.error || "Failed to generate report")
            }
        } catch (error) {
            console.error("Failed to generate report:", error)
            toast.error("Failed to generate report")
        } finally {
            setGenerating(false)
        }
    }

    const handleDeleteReport = async (id: string) => {
        if (!confirm("Are you sure you want to delete this report?")) return

        try {
            const { success, error } = await deleteReorderReport(id)
            if (success) {
                toast.success("Report deleted")
                setReports(reports.filter((r) => r.id !== id))
                if (selectedReport?.id === id) {
                    setSelectedReport(null)
                }
            } else {
                toast.error(error || "Failed to delete report")
            }
        } catch (error) {
            console.error("Failed to delete report:", error)
            toast.error("Failed to delete report")
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold">Weekly Reports</h2>
                    <p className="text-sm text-muted-foreground">AI-generated reorder insights and recommendations</p>
                </div>
                <Button onClick={handleGenerateReport} disabled={generating}>
                    {generating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Generate Report
                        </>
                    )}
                </Button>
            </div>

            {reports.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">No reports yet</p>
                        <p className="text-muted-foreground mb-4">Generate your first weekly reorder report</p>
                        <Button onClick={handleGenerateReport} disabled={generating}>
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Generate Report
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {reports.map((report) => (
                        <Card key={report.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="h-5 w-5" />
                                            Weekly Report
                                            <Badge variant="outline">
                                                {format(new Date(report.week_start), "MMM d")} -{" "}
                                                {format(new Date(report.week_end), "MMM d, yyyy")}
                                            </Badge>
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-4 mt-2">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {format(new Date(report.report_date), "PPP")}
                                            </span>
                                            {report.metadata?.availableBudget && (
                                                <span>Budget: {formatCurrency(report.metadata.availableBudget)}</span>
                                            )}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" onClick={() => setSelectedReport(report)}>
                                                    <FileText className="h-4 w-4 mr-2" />
                                                    View
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-4xl max-h-[80vh]">
                                                <DialogHeader>
                                                    <DialogTitle>
                                                        Weekly Report -{" "}
                                                        {format(new Date(report.week_start), "MMM d")} to{" "}
                                                        {format(new Date(report.week_end), "MMM d, yyyy")}
                                                    </DialogTitle>
                                                </DialogHeader>
                                                <ScrollArea className="h-[60vh] pr-4">
                                                    <div className="prose prose-sm max-w-none dark:prose-invert">
                                                        <ReactMarkdown>{report.report_content}</ReactMarkdown>
                                                    </div>
                                                </ScrollArea>
                                            </DialogContent>
                                        </Dialog>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteReport(report.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            {report.metadata && Object.keys(report.metadata).length > 0 && (
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {report.metadata.totalProducts && (
                                            <div>
                                                <p className="text-sm text-muted-foreground">Products Analyzed</p>
                                                <p className="text-lg font-semibold">{report.metadata.totalProducts}</p>
                                            </div>
                                        )}
                                        {report.metadata.totalRevenue && (
                                            <div>
                                                <p className="text-sm text-muted-foreground">Revenue (30d)</p>
                                                <p className="text-lg font-semibold">{formatCurrency(report.metadata.totalRevenue)}</p>
                                            </div>
                                        )}
                                        {report.metadata.totalProfit && (
                                            <div>
                                                <p className="text-sm text-muted-foreground">Profit (30d)</p>
                                                <p className="text-lg font-semibold">{formatCurrency(report.metadata.totalProfit)}</p>
                                            </div>
                                        )}
                                        {report.metadata.availableBudget && (
                                            <div>
                                                <p className="text-sm text-muted-foreground">Available Budget</p>
                                                <p className="text-lg font-semibold">{formatCurrency(report.metadata.availableBudget)}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
