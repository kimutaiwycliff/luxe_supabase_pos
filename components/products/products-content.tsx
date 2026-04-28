"use client"

import { useState, useCallback, useMemo } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Grid3X3, List, Printer, ShoppingCart, X, Loader2 } from "lucide-react"
import { ProductDetailSheet } from "./product-detail-sheet"
import { DeleteProductDialog } from "./delete-product-dialog"
import { PrintLabelsDialog, type LabelItem } from "./print-labels-dialog"
import { CreatePurchaseOrderDialog } from "@/components/purchase-orders/create-purchase-order-dialog"
import { getCategories } from "@/lib/actions/categories"
import { getSuppliers } from "@/lib/actions/suppliers"
import { getProductById, deleteProduct, getProductVariants } from "@/lib/actions/products"
import { deleteProductFromIndex } from "@/lib/actions/algolia"
import type { Product } from "@/lib/types"
import type { AlgoliaProduct } from "@/lib/algolia"
import { InstantSearch, Configure } from "react-instantsearch"
import { searchClient, ALGOLIA_INDEXES } from "@/lib/algolia-client"
import { AlgoliaSearchBox } from "@/components/search/algolia-search-box"
import { ProductHits } from "@/components/search/product-hits"
import { AlgoliaPagination } from "@/components/search/algolia-pagination"
import { toast } from "sonner"

type ViewMode = "grid" | "list"

export function ProductsContent() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [refreshKey, setRefreshKey] = useState(0)

  // Product detail sheet
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | AlgoliaProduct | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Restock PO dialog
  const [restockOpen, setRestockOpen] = useState(false)
  const [restockProduct, setRestockProduct] = useState<Product | null>(null)
  const [bulkRestockItems, setBulkRestockItems] = useState<{ product_id: string; product_name: string; sku: string; quantity: number; unit_cost: number }[] | undefined>(undefined)

  // Print labels
  const [bulkPrintOpen, setBulkPrintOpen] = useState(false)
  const [bulkPrintItems, setBulkPrintItems] = useState<LabelItem[]>([])
  const [isBuildingLabels, setIsBuildingLabels] = useState(false)

  // Multi-select
  const [selectedProducts, setSelectedProducts] = useState<Map<string, AlgoliaProduct>>(new Map())

  const { data: categoriesData } = useSWR("categories", () => getCategories({ is_active: true }))
  const { data: suppliersData } = useSWR("suppliers", () => getSuppliers())

  const categories = categoriesData?.categories || []
  const suppliers = (suppliersData as any[]) || []

  const filters = useMemo(() => {
    const parts: string[] = []
    if (categoryFilter !== "all") parts.push(`category_id:${categoryFilter}`)
    if (statusFilter !== "all") parts.push(`is_active:${statusFilter === "active"}`)
    return parts.join(" AND ")
  }, [categoryFilter, statusFilter])

  const openSheet = useCallback(async (algoliaProduct?: AlgoliaProduct) => {
    if (!algoliaProduct) { setEditingProduct(null); setSheetOpen(true); return }
    const result = await getProductById(algoliaProduct.objectID)
    if (result.product) { setEditingProduct(result.product); setSheetOpen(true) }
    else toast.error("Could not load product", { description: result.error ?? "Unknown error" })
  }, [])

  const handleRestock = useCallback((product: Product) => {
    setBulkRestockItems(undefined)
    setRestockProduct(product)
    setRestockOpen(true)
  }, [])

  const handleDelete = useCallback((product: AlgoliaProduct) => {
    setProductToDelete(product); setDeleteDialogOpen(true)
  }, [])

  const confirmDelete = async () => {
    if (!productToDelete) return
    const id = "objectID" in productToDelete ? productToDelete.objectID : productToDelete.id
    setIsDeleting(true)
    try {
      await deleteProduct(id)
      await deleteProductFromIndex(id)
      toast.success("Product deleted")
      setRefreshKey((k) => k + 1)
      setDeleteDialogOpen(false)
      setProductToDelete(null)
      setSheetOpen(false)
      setEditingProduct(null)
    } catch { toast.error("Failed to delete product") }
    finally { setIsDeleting(false) }
  }

  const handleDeleteFromSheet = useCallback(() => {
    if (!editingProduct) return
    setProductToDelete(editingProduct)
    setDeleteDialogOpen(true)
  }, [editingProduct])

  // ── Selection ────────────────────────────────────────────────────────────────
  const handleToggleSelect = useCallback((product: AlgoliaProduct) => {
    setSelectedProducts(prev => {
      const next = new Map(prev)
      if (next.has(product.objectID)) next.delete(product.objectID)
      else next.set(product.objectID, product)
      return next
    })
  }, [])

  const clearSelection = useCallback(() => setSelectedProducts(new Map()), [])

  // ── Bulk print ────────────────────────────────────────────────────────────────
  const handleBulkPrint = useCallback(async () => {
    setIsBuildingLabels(true)
    try {
      const items: LabelItem[] = []
      for (const product of selectedProducts.values()) {
        if (!product.has_variants) {
          items.push({
            id: product.objectID,
            barcode: product.barcode || product.sku,
            productName: product.name,
            price: product.selling_price,
          })
        } else {
          const result = await getProductVariants(product.objectID)
          for (const variant of result.variants ?? []) {
            if (!variant.is_active) continue
            const variantLabel = variant.option_values
              ? Object.values(variant.option_values).join(" / ")
              : (variant.name || variant.sku)
            items.push({
              id: `${product.objectID}-${variant.id}`,
              barcode: variant.barcode || variant.sku || product.sku,
              productName: product.name,
              variantName: variantLabel,
              price: variant.selling_price ?? product.selling_price,
            })
          }
        }
      }
      if (items.length === 0) {
        toast.error("No printable labels found for the selected products")
        return
      }
      setBulkPrintItems(items)
      setBulkPrintOpen(true)
    } catch {
      toast.error("Failed to build label list")
    } finally {
      setIsBuildingLabels(false)
    }
  }, [selectedProducts])

  // ── Bulk restock ──────────────────────────────────────────────────────────────
  const handleBulkRestock = useCallback(() => {
    const items = Array.from(selectedProducts.values()).map(p => ({
      product_id: p.objectID,
      product_name: p.name,
      sku: p.sku,
      quantity: 10,
      unit_cost: p.cost_price,
    }))
    setBulkRestockItems(items)
    setRestockProduct(null)
    setRestockOpen(true)
  }, [selectedProducts])

  const restockInitialItems = bulkRestockItems ?? (restockProduct
    ? [{ product_id: restockProduct.id, product_name: restockProduct.name, sku: restockProduct.sku, quantity: restockProduct.low_stock_threshold || 10, unit_cost: restockProduct.cost_price }]
    : undefined)

  const selectedCount = selectedProducts.size

  return (
    <div className="p-4 sm:p-6">
      <InstantSearch
        key={refreshKey}
        searchClient={searchClient}
        indexName={ALGOLIA_INDEXES.products}
        future={{ preserveSharedStateOnUnmount: true }}
      >
        <Configure key={`${filters}-20`} filters={filters} hitsPerPage={20} />

        {/* Toolbar */}
        <div className="mb-6 space-y-3">
          {/* Row 1: search + view toggle + add */}
          <div className="flex items-center gap-2">
            <AlgoliaSearchBox placeholder="Search products..." className="flex-1" />
            <div className="flex items-center rounded-lg border border-border p-1 shrink-0">
              <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("grid")}><Grid3X3 className="h-4 w-4" /></Button>
              <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("list")}><List className="h-4 w-4" /></Button>
            </div>
            <Button onClick={() => openSheet()} className="shrink-0">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Product</span>
            </Button>
          </div>
          {/* Row 2: filters */}
          <div className="flex items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="flex-1 sm:w-48 sm:flex-none"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1 sm:w-36 sm:flex-none"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ProductHits
          viewMode={viewMode}
          onOpen={openSheet}
          onDelete={handleDelete}
          onAdd={() => openSheet()}
          selectedIds={new Set(selectedProducts.keys())}
          onToggleSelect={handleToggleSelect}
        />
        <AlgoliaPagination />
      </InstantSearch>

      {/* ── Bulk-selection action bar ─────────────────────────────────────────── */}
      {selectedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-lg px-4 py-2.5">
          <span className="text-sm font-medium text-muted-foreground mr-1">
            {selectedCount} selected
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkPrint}
            disabled={isBuildingLabels}
          >
            {isBuildingLabels
              ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Building…</>
              : <><Printer className="h-3.5 w-3.5 mr-1.5" />Print Labels</>
            }
          </Button>
          <Button size="sm" variant="outline" onClick={handleBulkRestock}>
            <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
            Restock
          </Button>
          <Button size="sm" variant="ghost" onClick={clearSelection} className="h-7 w-7 p-0">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Product detail sheet — handles both create and edit + variants */}
      <ProductDetailSheet
        open={sheetOpen}
        onOpenChange={(v) => { setSheetOpen(v); if (!v) setEditingProduct(null) }}
        product={editingProduct}
        categories={categories}
        suppliers={suppliers}
        onSuccess={() => { setRefreshKey((k) => k + 1); setSheetOpen(false); setEditingProduct(null) }}
        onRestock={handleRestock}
        onDelete={handleDeleteFromSheet}
      />

      {/* Restock / quick PO */}
      <CreatePurchaseOrderDialog
        open={restockOpen}
        onOpenChange={setRestockOpen}
        onSuccess={() => { setRestockOpen(false); toast.success("Purchase order created") }}
        initialSupplierId={restockProduct?.supplier_id ?? undefined}
        initialItems={restockInitialItems}
      />

      {/* Bulk label print */}
      <PrintLabelsDialog open={bulkPrintOpen} onOpenChange={setBulkPrintOpen} items={bulkPrintItems} />

      {/* Delete */}
      <DeleteProductDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        product={productToDelete}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}
