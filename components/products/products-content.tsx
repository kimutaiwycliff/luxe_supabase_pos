"use client"

import { useState, useCallback, useMemo } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Grid3X3, List } from "lucide-react"
import { ProductDialog } from "./product-dialog"
import { VariantEditorDialog } from "./variant-editor-dialog"
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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [variantDialogOpen, setVariantDialogOpen] = useState(false)
  const [variantEditingProduct, setVariantEditingProduct] = useState<Product | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const { data: categoriesData } = useSWR("categories", async () => {
    const result = await getCategories({ is_active: true })
    return result
  })

  const { data: suppliersData } = useSWR("suppliers", async () => {
    const result = await getSuppliers()
    return result
  })

  const categories = categoriesData?.categories || []
  const suppliers = (suppliersData as any[]) || []

  const filters = useMemo(() => {
    const filterParts: string[] = []
    if (categoryFilter !== "all") {
      filterParts.push(`category_id:${categoryFilter}`)
    }
    if (statusFilter !== "all") {
      filterParts.push(`is_active:${statusFilter === "active"}`)
    }
    return filterParts.join(" AND ")
  }, [categoryFilter, statusFilter])

  const handleEdit = useCallback(async (algoliaProduct: AlgoliaProduct) => {
    const result = await getProductById(algoliaProduct.objectID)
    if (result.product) {
      setEditingProduct(result.product)
      setDialogOpen(true)
    }
  }, [])

  const handleEditVariants = useCallback(async (algoliaProduct: AlgoliaProduct) => {
    const result = await getProductById(algoliaProduct.objectID)
    if (result.product) {
      setVariantEditingProduct(result.product)
      setVariantDialogOpen(true)
    }
  }, [])

  const handleDelete = useCallback(
    async (productId: string) => {
      if (!confirm("Are you sure you want to delete this product?")) return

      try {
        await deleteProduct(productId)
        await deleteProductFromIndex(productId)
        toast.success("Product deleted")
        setRefreshKey((k) => k + 1)
      } catch (error) {
        console.error(error)
        toast.error("Failed to delete product")
      }
    },
    [],
  )

  const handleCreate = useCallback(() => {
    setEditingProduct(null)
    setDialogOpen(true)
  }, [])

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false)
    setEditingProduct(null)
  }, [])

  const handleSuccess = useCallback(() => {
    setRefreshKey((k) => k + 1)
    handleDialogClose()
  }, [handleDialogClose])

  return (
    <div className="p-6">
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
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-border p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Products Display */}
        <ProductHits
          viewMode={viewMode}
          onEdit={handleEdit}
          onEditVariants={handleEditVariants}
          onDelete={handleDelete}
          onAdd={handleCreate}
        />

        {/* Pagination */}
        <AlgoliaPagination />
      </InstantSearch>

      {/* Product Dialog */}
      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editingProduct}
        categories={categories}
        suppliers={suppliers}
        onSuccess={handleSuccess}
      />

      {/* Variant Editor Dialog */}
      {variantEditingProduct && (
        <VariantEditorDialog
          open={variantDialogOpen}
          onOpenChange={setVariantDialogOpen}
          product={variantEditingProduct}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  )
}
