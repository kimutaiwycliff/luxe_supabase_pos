"use client"

import { useState } from "react"
import useSWR from "swr"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/format"
import { Skeleton } from "@/components/ui/skeleton"
import { Package, Plus } from "lucide-react"
import type { Product, ProductVariant } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getCategories } from "@/lib/actions/categories"
import { getProducts, getProductVariants } from "@/lib/actions/products"

interface POSProductGridProps {
  searchQuery: string
  onAddToCart: (product: Product, variant?: ProductVariant) => void
}

export function POSProductGrid({ searchQuery, onAddToCart }: POSProductGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [variantDialogOpen, setVariantDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const { data: categoriesData } = useSWR("categories-active", async () => {
    const result = await getCategories({ is_active: true })
    return result
  })

  const { data: productsData, isLoading } = useSWR(["pos-products", searchQuery, selectedCategory], async () => {
    const result = await getProducts({
      search: searchQuery || undefined,
      category_id: selectedCategory !== "all" ? selectedCategory : undefined,
      is_active: true,
    })
    return result
  })

  const categories = categoriesData?.categories || []
  const products = productsData?.products || []

  const handleProductClick = async (product: Product) => {
    if (product.has_variants) {
      setSelectedProduct(product)
      setVariantDialogOpen(true)
    } else {
      onAddToCart(product)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-4">
        <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            All
          </TabsTrigger>
          {categories.map((cat) => (
            <TabsTrigger
              key={cat.id}
              value={cat.id}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center">
          <Package className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium">No products found</p>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? "Try a different search term" : "Add products to get started"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <Card
              key={product.id}
              className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
              onClick={() => handleProductClick(product)}
            >
              <CardContent className="p-3">
                <div className="relative mb-2 aspect-square overflow-hidden rounded-lg bg-secondary">
                  {product.image_url ? (
                    <Image
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl text-muted-foreground/50">
                      {product.name.charAt(0)}
                    </div>
                  )}
                  {product.has_variants && (
                    <div className="absolute bottom-1 right-1 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-medium">
                      Variants
                    </div>
                  )}
                </div>
                <h3 className="truncate text-sm font-medium">{product.name}</h3>
                <p className="text-xs text-muted-foreground">{product.sku}</p>
                <p className="mt-1 font-semibold text-primary">{formatCurrency(product.selling_price)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Variant Selection Dialog */}
      <VariantDialog
        open={variantDialogOpen}
        onOpenChange={setVariantDialogOpen}
        product={selectedProduct}
        onSelect={(variant) => {
          if (selectedProduct) {
            onAddToCart(selectedProduct, variant)
          }
          setVariantDialogOpen(false)
        }}
      />
    </div>
  )
}

interface VariantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSelect: (variant: ProductVariant) => void
}

function VariantDialog({ open, onOpenChange, product, onSelect }: VariantDialogProps) {
  const { data: variantsData, isLoading } = useSWR(product && open ? ["variants", product.id] : null, async () => {
    if (!product) return { variants: [] }
    const result = await getProductVariants(product.id)
    return result
  })

  const variants = variantsData?.variants || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Variant - {product?.name}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : variants.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No variants available</p>
        ) : (
          <div className="space-y-2">
            {variants
              .filter((v) => v.is_active)
              .map((variant) => (
                <Button
                  key={variant.id}
                  variant="outline"
                  className="h-auto w-full justify-between p-4 bg-transparent"
                  onClick={() => onSelect(variant)}
                >
                  <div className="text-left">
                    <p className="font-medium">{Object.values(variant.option_values).join(" / ")}</p>
                    <p className="text-xs text-muted-foreground">{variant.sku}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {formatCurrency(variant.selling_price || product?.selling_price || 0)}
                    </span>
                    <Plus className="h-4 w-4" />
                  </div>
                </Button>
              ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
