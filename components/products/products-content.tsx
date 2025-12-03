"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Grid3X3, List, Filter } from "lucide-react"
import { ProductCard } from "./product-card"
import { ProductTable } from "./product-table"
import { ProductDialog } from "./product-dialog"
import { VariantEditorDialog } from "./variant-editor-dialog"
import { getProducts } from "@/lib/actions/products"
import { getCategories } from "@/lib/actions/categories"
import type { Product } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"

type ViewMode = "grid" | "list"

export function ProductsContent() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [variantDialogOpen, setVariantDialogOpen] = useState(false)
  const [variantEditingProduct, setVariantEditingProduct] = useState<Product | null>(null)

  const {
    data: productsData,
    isLoading: productsLoading,
    mutate,
  } = useSWR(["products", search, categoryFilter, statusFilter], async () => {
    const result = await getProducts({
      search: search || undefined,
      category_id: categoryFilter !== "all" ? categoryFilter : undefined,
      is_active: statusFilter === "all" ? undefined : statusFilter === "active",
    })
    return result
  })

  const { data: categoriesData } = useSWR("categories", async () => {
    const result = await getCategories({ is_active: true })
    return result
  })

  const products = productsData?.products || []
  const categories = categoriesData?.categories || []

  const handleEdit = useCallback((product: Product) => {
    setEditingProduct(product)
    setDialogOpen(true)
  }, [])

  const handleEditVariants = useCallback((product: Product) => {
    setVariantEditingProduct(product)
    setVariantDialogOpen(true)
  }, [])

  const handleCreate = useCallback(() => {
    setEditingProduct(null)
    setDialogOpen(true)
  }, [])

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false)
    setEditingProduct(null)
  }, [])

  const handleSuccess = useCallback(() => {
    mutate()
    handleDialogClose()
  }, [mutate, handleDialogClose])

  return (
    <div className="p-6">
      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

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
      {productsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border">
          <Filter className="h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium text-foreground">No products found</p>
          <p className="text-sm text-muted-foreground">
            {search || categoryFilter !== "all"
              ? "Try adjusting your filters"
              : "Get started by adding your first product"}
          </p>
          <Button className="mt-4" onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEdit}
              onEditVariants={handleEditVariants}
              onDelete={() => mutate()}
            />
          ))}
        </div>
      ) : (
        <ProductTable
          products={products}
          onEdit={handleEdit}
          onEditVariants={handleEditVariants}
          onDelete={() => mutate()}
        />
      )}

      {/* Product Dialog */}
      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editingProduct}
        categories={categories}
        onSuccess={handleSuccess}
      />

      {/* Variant Editor Dialog */}
      {variantEditingProduct && (
        <VariantEditorDialog
          open={variantDialogOpen}
          onOpenChange={setVariantDialogOpen}
          product={variantEditingProduct}
          onSuccess={() => mutate()}
        />
      )}
    </div>
  )
}
