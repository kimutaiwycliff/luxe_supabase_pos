"use client"

import { useState, useCallback, useMemo } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Grid3X3, List } from "lucide-react"
import { ProductDetailSheet } from "./product-detail-sheet"
import { DeleteProductDialog } from "./delete-product-dialog"
import { PrintLabelsDialog, type LabelItem } from "./print-labels-dialog"
import { CreatePurchaseOrderDialog } from "@/components/purchase-orders/create-purchase-order-dialog"
import { getCategories } from "@/lib/actions/categories"
import { getSuppliers } from "@/lib/actions/suppliers"
import { getProductById, deleteProduct } from "@/lib/actions/products"
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
  const [productToDelete, setProductToDelete] = useState<AlgoliaProduct | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Restock PO dialog
  const [restockOpen, setRestockOpen] = useState(false)
  const [restockProduct, setRestockProduct] = useState<Product | null>(null)

  // Bulk print labels (selected from product hits)
  const [bulkPrintOpen, setBulkPrintOpen] = useState(false)
  const [bulkPrintItems] = useState<LabelItem[]>([])

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
    setRestockProduct(product)
    setRestockOpen(true)
  }, [])

  const handleDelete = useCallback((product: AlgoliaProduct) => {
    setProductToDelete(product); setDeleteDialogOpen(true)
  }, [])

  const confirmDelete = async () => {
    if (!productToDelete) return
    setIsDeleting(true)
    try {
      await deleteProduct(productToDelete.objectID)
      await deleteProductFromIndex(productToDelete.objectID)
      toast.success("Product deleted")
      setRefreshKey((k) => k + 1)
      setDeleteDialogOpen(false)
      setProductToDelete(null)
    } catch { toast.error("Failed to delete product") }
    finally { setIsDeleting(false) }
  }

  const restockInitialItems = restockProduct
    ? [{ product_id: restockProduct.id, product_name: restockProduct.name, sku: restockProduct.sku, quantity: restockProduct.low_stock_threshold || 10, unit_cost: restockProduct.cost_price }]
    : undefined

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
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <AlgoliaSearchBox placeholder="Search products..." className="flex-1 max-w-sm" />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-border p-1">
              <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("grid")}><Grid3X3 className="h-4 w-4" /></Button>
              <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("list")}><List className="h-4 w-4" /></Button>
            </div>
            <Button onClick={() => openSheet()}>
              <Plus className="mr-2 h-4 w-4" />Add Product
            </Button>
          </div>
        </div>

        <ProductHits
          viewMode={viewMode}
          onEdit={openSheet}
          onEditVariants={openSheet}
          onDelete={handleDelete}
          onAdd={() => openSheet()}
        />
        <AlgoliaPagination />
      </InstantSearch>

      {/* Product detail sheet — handles both create and edit + variants */}
      <ProductDetailSheet
        open={sheetOpen}
        onOpenChange={(v) => { setSheetOpen(v); if (!v) setEditingProduct(null) }}
        product={editingProduct}
        categories={categories}
        suppliers={suppliers}
        onSuccess={() => { setRefreshKey((k) => k + 1); setSheetOpen(false); setEditingProduct(null) }}
        onRestock={handleRestock}
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
