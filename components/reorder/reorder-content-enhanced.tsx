"use client"

import { useState, useEffect } from "react"
import {
    AlertTriangle,
    Package,
    ShoppingCart,
    CheckCircle2,
    Sparkles,
    TrendingUp,
    TrendingDown,
    Loader2,
    FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getLowStockProducts, getReorderAlerts, resolveReorderAlert } from "@/lib/actions/purchase-orders"
import { generateReorderRecommendations } from "@/lib/services/reorder-engine"
import { CreatePurchaseOrderDialog } from "@/components/purchase-orders/create-purchase-order-dialog"
import { formatCurrency } from "@/lib/format"
import { toast } from "sonner"

interface LowStockProduct {
    id: string
    name: string
    sku: string
    cost_price: number
    low_stock_threshold: number | null
    reorder_quantity: number | null
    supplier: {
        id: string
        name: string
        email: string | null
        phone: string | null
    }[] | null
    inventory: {
        quantity: number
        reserved_quantity: number
        location: {
            id: string
            name: string
        }[]
    }[]
}

interface ReorderAlert {
    id: string
    alert_type: string
    current_quantity: number
    is_resolved: boolean
    created_at: string
    product: {
        id: string
        name: string
        sku: string
        cost_price: number
        supplier: {
            id: string
            name: string
            email: string | null
        } | null
    } | null
    variant: {
        id: string
        sku: string
        variant_name: string
    } | null
}

export function ReorderContentEnhanced() {
    const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([])
    const [alerts, setAlerts] = useState<ReorderAlert[]>([])
    const [loading, setLoading] = useState(true)
    const [aiLoading, setAiLoading] = useState(false)
    const [aiRecommendations, setAiRecommendations] = useState<any>(null)
    const [createOrderOpen, setCreateOrderOpen] = useState(false)
    const [activeTab, setActiveTab] = useState("overview")

    const loadData = async () => {
        try {
            const [productsData, alertsData] = await Promise.all([getLowStockProducts(), getReorderAlerts()])
            setLowStockProducts(productsData || [])
            setAlerts(alertsData || [])
        } catch (error) {
            console.error("Failed to load reorder data:", error)
            toast.error("Failed to load reorder data")
        } finally {
            setLoading(false)
        }
    }

    const loadAIRecommendations = async () => {
        setAiLoading(true)
        try {
            const result = await generateReorderRecommendations()
            if (result.success && result.data) {
                setAiRecommendations(result.data)
                toast.success("AI recommendations generated successfully")
            } else {
                toast.error(result.error || "Failed to generate AI recommendations")
            }
        } catch (error) {
            console.error("Failed to load AI recommendations:", error)
            toast.error("Failed to load AI recommendations")
        } finally {
            setAiLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const handleResolveAlert = async (id: string) => {
        try {
            await resolveReorderAlert(id)
            toast.success("Alert resolved")
            loadData()
        } catch (error) {
            console.error("Failed to resolve alert:", error)
            toast.error("Failed to resolve alert")
        }
    }

    const outOfStock = lowStockProducts.filter((p) => {
        const total = p.inventory?.reduce((sum, inv) => sum + (inv.quantity - inv.reserved_quantity), 0) || 0
        return total <= 0
    })

    const lowStock = lowStockProducts.filter((p) => {
        const total = p.inventory?.reduce((sum, inv) => sum + (inv.quantity - inv.reserved_quantity), 0) || 0
        return total > 0 && total <= (p.low_stock_threshold || 0)
    })

    if (loading) {
        return <div className="flex items-center justify-center h-64">Loading...</div>
    }

    const recommendations = aiRecommendations?.recommendations
    const metadata = aiRecommendations?.metadata

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Smart Reorder Management</h1>
                    <p className="text-sm text-muted-foreground">AI-powered inventory optimization</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={loadAIRecommendations} disabled={aiLoading} variant="outline">
                        {aiLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Get AI Insights
                            </>
                        )}
                    </Button>
                    <Button variant="outline" asChild>
                        <a href="/reorder/reports">
                            <FileText className="mr-2 h-4 w-4" />
                            View Reports
                        </a>
                    </Button>
                    <Button onClick={() => setCreateOrderOpen(true)}>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Create Purchase Order
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-destructive/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{outOfStock.length}</div>
                        <p className="text-xs text-muted-foreground">products need immediate reorder</p>
                    </CardContent>
                </Card>

                <Card className="border-yellow-500/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                        <Package className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-500">{lowStock.length}</div>
                        <p className="text-xs text-muted-foreground">products below reorder point</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{alerts.length}</div>
                        <p className="text-xs text-muted-foreground">pending reorder alerts</p>
                    </CardContent>
                </Card>

                {metadata && (
                    <Card className="border-primary/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Available Budget</CardTitle>
                            <Sparkles className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(metadata.availableBudget)}</div>
                            <p className="text-xs text-muted-foreground">for reordering this week</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* AI Recommendations Section */}
            {recommendations && (
                <Card className="border-primary/50 bg-primary/5">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            <CardTitle>AI Recommendations</CardTitle>
                        </div>
                        <CardDescription>Smart suggestions based on sales velocity, profit margins, and cash flow</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="critical">
                                    Critical ({recommendations.critical?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger value="recommended">
                                    Recommended ({recommendations.recommended?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger value="insights">Insights</TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="space-y-4 mt-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <Alert>
                                        <TrendingUp className="h-4 w-4" />
                                        <AlertTitle>Total Recommended Orders</AlertTitle>
                                        <AlertDescription>
                                            {(recommendations.critical?.length || 0) +
                                                (recommendations.recommended?.length || 0) +
                                                (recommendations.optional?.length || 0)}{" "}
                                            products
                                        </AlertDescription>
                                    </Alert>
                                    <Alert>
                                        <ShoppingCart className="h-4 w-4" />
                                        <AlertTitle>Estimated Total Cost</AlertTitle>
                                        <AlertDescription>{formatCurrency(recommendations.totalEstimatedCost || 0)}</AlertDescription>
                                    </Alert>
                                </div>

                                {recommendations.budgetAllocation && recommendations.budgetAllocation.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold mb-3">Budget Allocation by Supplier</h3>
                                        <div className="space-y-2">
                                            {recommendations.budgetAllocation.map((allocation: any, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                                                    <div>
                                                        <p className="font-medium">{allocation.supplierName}</p>
                                                        <Badge variant={allocation.priority === "high" ? "destructive" : "secondary"}>
                                                            {allocation.priority} priority
                                                        </Badge>
                                                    </div>
                                                    <p className="text-lg font-semibold">{formatCurrency(allocation.allocatedBudget)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="critical" className="space-y-3 mt-4">
                                {recommendations.critical && recommendations.critical.length > 0 ? (
                                    recommendations.critical.map((rec: any, idx: number) => (
                                        <Card key={idx} className="border-destructive/30">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-1 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <AlertTriangle className="h-4 w-4 text-destructive" />
                                                            <p className="font-medium">{rec.productName}</p>
                                                            <Badge variant="destructive">{rec.daysUntilStockout} days left</Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
                                                        <p className="text-sm">
                                                            <span className="text-muted-foreground">Supplier:</span> {rec.supplierName}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-muted-foreground">Recommended Qty</p>
                                                        <p className="text-xl font-bold">{rec.recommendedQuantity}</p>
                                                        <p className="text-sm text-muted-foreground">{formatCurrency(rec.estimatedCost)}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">No critical reorders needed</p>
                                )}
                            </TabsContent>

                            <TabsContent value="recommended" className="space-y-3 mt-4">
                                {recommendations.recommended && recommendations.recommended.length > 0 ? (
                                    recommendations.recommended.map((rec: any, idx: number) => (
                                        <Card key={idx}>
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-1 flex-1">
                                                        <p className="font-medium">{rec.productName}</p>
                                                        <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
                                                        <div className="flex items-center gap-4 text-sm">
                                                            <span>
                                                                <span className="text-muted-foreground">Stock:</span> {rec.currentStock}
                                                            </span>
                                                            <span>
                                                                <span className="text-muted-foreground">Supplier:</span> {rec.supplierName}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-muted-foreground">Recommended Qty</p>
                                                        <p className="text-xl font-bold">{rec.recommendedQuantity}</p>
                                                        <p className="text-sm text-muted-foreground">{formatCurrency(rec.estimatedCost)}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">No recommendations at this time</p>
                                )}
                            </TabsContent>

                            <TabsContent value="insights" className="space-y-4 mt-4">
                                {recommendations.insights && recommendations.insights.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold mb-3">AI Insights</h3>
                                        <div className="space-y-2">
                                            {recommendations.insights.map((insight: string, idx: number) => (
                                                <Alert key={idx}>
                                                    <TrendingUp className="h-4 w-4" />
                                                    <AlertDescription>{insight}</AlertDescription>
                                                </Alert>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {recommendations.riskAlerts && recommendations.riskAlerts.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold mb-3">Risk Alerts</h3>
                                        <div className="space-y-2">
                                            {recommendations.riskAlerts.map((alert: string, idx: number) => (
                                                <Alert key={idx} variant="destructive">
                                                    <AlertTriangle className="h-4 w-4" />
                                                    <AlertDescription>{alert}</AlertDescription>
                                                </Alert>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            )}

            {/* Traditional View - Out of Stock Products */}
            {outOfStock.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Out of Stock ({outOfStock.length})
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        {outOfStock.map((product) => (
                            <Card key={product.id} className="border-destructive/30">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="font-medium">{product.name}</p>
                                            <p className="text-sm text-muted-foreground">{product.sku}</p>
                                            {product.supplier && (
                                                <p className="text-sm text-muted-foreground">Supplier: {product.supplier?.[0]?.name || "Unknown"}</p>
                                            )}
                                        </div>
                                        <Badge variant="destructive">Out of Stock</Badge>
                                    </div>
                                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                                        <div className="text-sm">
                                            <span className="text-muted-foreground">Reorder Qty: </span>
                                            <span className="font-medium">{product.reorder_quantity || "Not set"}</span>
                                        </div>
                                        <div className="text-sm">
                                            <span className="text-muted-foreground">Cost: </span>
                                            <span className="font-medium">{formatCurrency(product.cost_price)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Low Stock Products */}
            {lowStock.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Package className="h-5 w-5 text-yellow-500" />
                        Low Stock ({lowStock.length})
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        {lowStock.map((product) => {
                            const totalStock =
                                product.inventory?.reduce((sum, inv) => sum + (inv.quantity - inv.reserved_quantity), 0) || 0

                            return (
                                <Card key={product.id} className="border-yellow-500/30">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <p className="font-medium">{product.name}</p>
                                                <p className="text-sm text-muted-foreground">{product.sku}</p>
                                                {product.supplier && (
                                                    <p className="text-sm text-muted-foreground">Supplier: {product.supplier?.[0]?.name || "Unknown"}</p>
                                                )}
                                            </div>
                                            <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                                                {totalStock} left
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between mt-4 pt-3 border-t">
                                            <div className="text-sm">
                                                <span className="text-muted-foreground">Reorder Point: </span>
                                                <span className="font-medium">{product.low_stock_threshold}</span>
                                            </div>
                                            <div className="text-sm">
                                                <span className="text-muted-foreground">Reorder Qty: </span>
                                                <span className="font-medium">{product.reorder_quantity || "Not set"}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Reorder Alerts */}
            {alerts.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Recent Alerts</h2>
                    <div className="space-y-3">
                        {alerts.map((alert) => (
                            <Card key={alert.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    {alert.product?.name || "Unknown Product"}
                                                    {alert.variant && ` - ${alert.variant.variant_name}`}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {alert.alert_type === "out_of_stock" ? "Out of stock" : "Low stock"} • Current:{" "}
                                                    {alert.current_quantity} units
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => handleResolveAlert(alert.id)}>
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Resolve
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {lowStockProducts.length === 0 && alerts.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <CheckCircle2 className="h-12 w-12 text-primary mb-4" />
                        <p className="text-lg font-medium">All stocked up!</p>
                        <p className="text-muted-foreground">No products require reordering at this time.</p>
                    </CardContent>
                </Card>
            )}

            <CreatePurchaseOrderDialog open={createOrderOpen} onOpenChange={setCreateOrderOpen} onSuccess={loadData} />
        </div>
    )
}
