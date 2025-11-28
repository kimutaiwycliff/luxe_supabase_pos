"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Package, ShoppingCart, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getLowStockProducts, getReorderAlerts, resolveReorderAlert } from "@/lib/actions/purchase-orders"
import { CreatePurchaseOrderDialog } from "@/components/purchase-orders/create-purchase-order-dialog"
import { formatCurrency } from "@/lib/format"
import { toast } from "sonner"

interface InventoryItem {
  quantity: number
  reserved_quantity: number
  location: { id: string; name: string } | null
}

interface LowStockProduct {
  id: string
  name: string
  sku: string
  cost_price: number
  reorder_point: number | null
  reorder_quantity: number | null
  supplier: {
    id: string
    name: string
    email: string | null
    phone: string | null
  } | null
  inventory: InventoryItem[]
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

export function ReorderContent() {
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([])
  const [alerts, setAlerts] = useState<ReorderAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [createOrderOpen, setCreateOrderOpen] = useState(false)

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
    return total > 0 && total <= (p.reorder_point || 0)
  })

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reorder Management</h1>
        <Button onClick={() => setCreateOrderOpen(true)}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Create Purchase Order
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
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
      </div>

      {/* Out of Stock Products */}
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
                        <p className="text-sm text-muted-foreground">Supplier: {product.supplier.name}</p>
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
                          <p className="text-sm text-muted-foreground">Supplier: {product.supplier.name}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                        {totalStock} left
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Reorder Point: </span>
                        <span className="font-medium">{product.reorder_point}</span>
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
