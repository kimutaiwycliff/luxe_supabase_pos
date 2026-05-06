"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Loader2, Search, Trash2, AlertTriangle, ShoppingCart, ChevronDown, ChevronRight, PackageX,
} from "lucide-react"
import { getLowStockProducts, createPurchaseOrder } from "@/lib/actions/purchase-orders"
import { getProducts } from "@/lib/actions/products"
import { formatCurrency } from "@/lib/format"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface RestockItem {
  product_id: string
  product_name: string
  sku: string
  unit_cost: number
  quantity: number
  current_stock: number
  threshold: number
  supplier_id: string | null
  supplier_name: string | null
}

interface RestockSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  /** Pre-seed with specific items (e.g. from a single product restock button) */
  initialItems?: Array<{ product_id: string; product_name: string; sku: string; quantity: number; unit_cost: number }>
}

export function RestockSheet({ open, onOpenChange, onSuccess, initialItems }: RestockSheetProps) {
  const [items, setItems] = useState<RestockItem[]>([])
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [collapsedSuppliers, setCollapsedSuppliers] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!open) return
    setSearch("")
    loadData()
  }, [open])

  const loadData = async () => {
    setLoading(true)
    try {
      const [lowStock, productsResult] = await Promise.all([
        getLowStockProducts(),
        getProducts(),
      ])
      setAllProducts(productsResult.products || [])

      if (initialItems && initialItems.length > 0) {
        // Seed with explicit items passed in
        const products = productsResult.products || []
        const seeded: RestockItem[] = initialItems.map((init) => {
          const product = products.find((p: any) => p.id === init.product_id)
          return {
            product_id: init.product_id,
            product_name: init.product_name,
            sku: init.sku,
            unit_cost: init.unit_cost,
            quantity: init.quantity,
            current_stock: 0,
            threshold: product?.low_stock_threshold ?? 0,
            supplier_id: product?.supplier_id ?? null,
            supplier_name: (product as any)?.supplier?.name ?? null,
          }
        })
        setItems(seeded)
      } else {
        // Pre-populate with low-stock products
        const seeded: RestockItem[] = (lowStock || []).map((p: any) => {
          const totalStock = (p.inventory || []).reduce(
            (sum: number, inv: any) => sum + (inv.quantity - (inv.reserved_quantity || 0)),
            0,
          )
          return {
            product_id: p.id,
            product_name: p.name,
            sku: p.sku,
            unit_cost: p.cost_price || 0,
            quantity: p.reorder_quantity || p.low_stock_threshold || 10,
            current_stock: totalStock,
            threshold: p.low_stock_threshold || 0,
            supplier_id: p.supplier?.id ?? null,
            supplier_name: p.supplier?.name ?? null,
          }
        })
        setItems(seeded)
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  // ── Search dropdown ────────────────────────────────────────────────
  const searchResults = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return allProducts
      .filter(
        (p: any) =>
          !items.some((i) => i.product_id === p.id) &&
          (p.name.toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q)),
      )
      .slice(0, 6)
  }, [search, allProducts, items])

  const addProduct = (product: any) => {
    const totalStock = (product.inventory || []).reduce(
      (sum: number, inv: any) => sum + (inv.quantity - (inv.reserved_quantity || 0)),
      0,
    )
    setItems((prev) => [
      ...prev,
      {
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        unit_cost: product.cost_price || 0,
        quantity: product.reorder_quantity || product.low_stock_threshold || 10,
        current_stock: totalStock,
        threshold: product.low_stock_threshold || 0,
        supplier_id: product.supplier_id ?? null,
        supplier_name: (product as any)?.supplier?.name ?? null,
      },
    ])
    setSearch("")
  }

  const updateItem = (product_id: string, field: "quantity" | "unit_cost", value: number) => {
    setItems((prev) =>
      prev.map((item) => (item.product_id === product_id ? { ...item, [field]: value } : item)),
    )
  }

  const removeItem = (product_id: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== product_id))
  }

  // ── Group by supplier ──────────────────────────────────────────────
  const grouped = useMemo(() => {
    const map = new Map<string, { supplier_id: string | null; supplier_name: string; items: RestockItem[] }>()
    for (const item of items) {
      const key = item.supplier_id ?? "__none__"
      const name = item.supplier_name ?? "No Supplier Assigned"
      if (!map.has(key)) map.set(key, { supplier_id: item.supplier_id, supplier_name: name, items: [] })
      map.get(key)!.items.push(item)
    }
    // Sort: suppliers with IDs first, "no supplier" last
    return [...map.entries()]
      .sort(([a], [b]) => {
        if (a === "__none__") return 1
        if (b === "__none__") return -1
        return (map.get(a)!.supplier_name).localeCompare(map.get(b)!.supplier_name)
      })
      .map(([, group]) => group)
  }, [items])

  const orderableGroups = grouped.filter((g) => g.supplier_id !== null)
  const totalOrderable = orderableGroups.reduce((sum, g) => sum + g.items.length, 0)
  const grandTotal = orderableGroups.reduce(
    (sum, g) => sum + g.items.reduce((s, i) => s + i.quantity * i.unit_cost, 0),
    0,
  )

  // ── Submit ─────────────────────────────────────────────────────────
  const handleCreateOrders = async () => {
    if (orderableGroups.length === 0) return
    setSubmitting(true)
    let created = 0
    let failed = 0
    for (const group of orderableGroups) {
      if (!group.supplier_id) continue
      try {
        await createPurchaseOrder(
          group.supplier_id,
          group.items.map((i) => ({
            product_id: i.product_id,
            quantity_ordered: i.quantity,
            unit_cost: i.unit_cost,
          })),
        )
        created++
      } catch (err: any) {
        console.error(`Failed to create PO for ${group.supplier_name}:`, err)
        toast.error(`Failed to create PO for ${group.supplier_name}`, { description: err?.message })
        failed++
      }
    }
    setSubmitting(false)
    if (created > 0) {
      toast.success(`Created ${created} purchase order${created > 1 ? "s" : ""}`)
      onSuccess()
      onOpenChange(false)
    }
  }

  const toggleSupplier = (name: string) => {
    setCollapsedSuppliers((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full sm:max-w-2xl flex flex-col p-0 gap-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <SheetHeader className="flex-row items-center gap-3 px-5 py-4 border-b flex-shrink-0 pr-12">
          <ShoppingCart className="h-5 w-5 text-primary flex-shrink-0" />
          <div>
            <SheetTitle className="text-base">Restock</SheetTitle>
            <p className="text-xs text-muted-foreground">
              {items.length === 0
                ? "Add products to order"
                : `${items.length} item${items.length !== 1 ? "s" : ""} across ${orderableGroups.length} supplier${orderableGroups.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </SheetHeader>

        {/* Search to add products */}
        <div className="px-5 py-3 border-b flex-shrink-0 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search to add a product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="absolute left-5 right-5 top-full mt-0.5 z-50 bg-background border border-border rounded-lg shadow-lg overflow-hidden">
              {searchResults.map((p: any) => (
                <button
                  key={p.id}
                  type="button"
                  className="w-full text-left px-3 py-2.5 hover:bg-muted/60 flex items-center justify-between gap-3 text-sm"
                  onClick={() => addProduct(p)}
                >
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.sku} {p.supplier?.name ? `· ${p.supplier.name}` : ""}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{formatCurrency(p.cost_price)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-5">
              <PackageX className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">No items to restock</p>
              <p className="text-sm text-muted-foreground mt-1">
                All stock levels are above threshold, or search above to add products manually.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {grouped.map((group) => {
                const isNoSupplier = group.supplier_id === null
                const collapsed = collapsedSuppliers.has(group.supplier_name)
                const groupTotal = group.items.reduce((s, i) => s + i.quantity * i.unit_cost, 0)

                return (
                  <div key={group.supplier_name}>
                    {/* Supplier header */}
                    <button
                      type="button"
                      onClick={() => toggleSupplier(group.supplier_name)}
                      className={cn(
                        "w-full flex items-center justify-between px-5 py-2.5 text-left hover:bg-muted/40 transition-colors",
                        isNoSupplier ? "bg-amber-50 dark:bg-amber-950/20" : "bg-muted/20",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {collapsed ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                        {isNoSupplier && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                        <span className={cn("text-sm font-semibold", isNoSupplier && "text-amber-600 dark:text-amber-400")}>
                          {group.supplier_name}
                        </span>
                        <Badge variant="outline" className="text-xs h-5">
                          {group.items.length}
                        </Badge>
                      </div>
                      {!isNoSupplier && (
                        <span className="text-sm font-medium text-muted-foreground">{formatCurrency(groupTotal)}</span>
                      )}
                      {isNoSupplier && (
                        <span className="text-xs text-amber-500">Assign a supplier to include in orders</span>
                      )}
                    </button>

                    {/* Items */}
                    {!collapsed && (
                      <div>
                        {group.items.map((item) => (
                          <div
                            key={item.product_id}
                            className={cn(
                              "flex items-center gap-3 px-5 py-3 border-t border-border/50 hover:bg-muted/20",
                              isNoSupplier && "opacity-60",
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.product_name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-muted-foreground font-mono">{item.sku}</span>
                                <Badge
                                  variant={item.current_stock <= 0 ? "destructive" : "secondary"}
                                  className="text-[10px] h-4 px-1.5"
                                >
                                  {item.current_stock <= 0 ? "Out" : `${item.current_stock} in stock`}
                                </Badge>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <div className="space-y-0.5">
                                <p className="text-[10px] text-muted-foreground text-center">Qty</p>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateItem(item.product_id, "quantity", parseInt(e.target.value) || 1)
                                  }
                                  className="w-16 h-8 text-center text-sm"
                                />
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-[10px] text-muted-foreground text-center">Cost</p>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unit_cost}
                                  onChange={(e) =>
                                    updateItem(item.product_id, "unit_cost", parseFloat(e.target.value) || 0)
                                  }
                                  className="w-24 h-8 text-right text-sm"
                                />
                              </div>
                              <div className="w-20 text-right">
                                <p className="text-[10px] text-muted-foreground">Total</p>
                                <p className="text-sm font-medium">{formatCurrency(item.quantity * item.unit_cost)}</p>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                                onClick={() => removeItem(item.product_id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <SheetFooter className="flex-shrink-0 border-t px-5 py-4 flex-row items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {orderableGroups.length > 0 ? (
              <span>
                <strong className="text-foreground">{orderableGroups.length}</strong> PO{orderableGroups.length !== 1 ? "s" : ""} ·{" "}
                <strong className="text-foreground">{totalOrderable}</strong> item{totalOrderable !== 1 ? "s" : ""} ·{" "}
                <strong className="text-foreground">{formatCurrency(grandTotal)}</strong>
              </span>
            ) : (
              <span>No orderable items</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateOrders}
              disabled={submitting || orderableGroups.length === 0}
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Create {orderableGroups.length > 1 ? `${orderableGroups.length} Orders` : "Order"}
                </>
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
