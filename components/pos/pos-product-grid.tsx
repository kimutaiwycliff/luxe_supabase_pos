"use client"

import { useState, useEffect, useMemo } from "react"
import useSWR from "swr"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getProductVariants, getProductById } from "@/lib/actions/products"
import { getCategories } from "@/lib/actions/categories"
import { getProductStock, getVariantStock } from "@/lib/actions/inventory"
import { formatCurrency } from "@/lib/format"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, AlertTriangle } from "lucide-react"
import type { Product, ProductVariant } from "@/lib/types"
import type { AlgoliaProduct } from "@/lib/algolia"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InstantSearch, Configure, useHits, useSearchBox, useInstantSearch } from "react-instantsearch"
import { searchClient, ALGOLIA_INDEXES } from "@/lib/algolia-client"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Package } from "lucide-react"

interface POSProductGridProps {
  searchQuery: string
  onAddToCart: (product: Product, variant?: ProductVariant, availableStock?: number) => void
  locationId?: string
}

export function POSProductGrid({ searchQuery, onAddToCart, locationId }: POSProductGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [variantDialogOpen, setVariantDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const { data: categoriesData } = useSWR("categories-active", async () => {
    const result = await getCategories({ is_active: true })
    return result
  })

  const categories = categoriesData?.categories || []

  // Build Algolia filters - memoized
  const filters = useMemo(() => {
    const filterParts: string[] = [] // Remove ["is_active:true"]
    if (selectedCategory !== "all") {
      filterParts.push(`category_id:${selectedCategory}`)
    }
    return filterParts.join(" AND ")
  }, [selectedCategory])

  const handleProductClick = async (algoliaProduct: AlgoliaProduct) => {
    const result = await getProductById(algoliaProduct.objectID)
    if (!result.product) return

    if (result.product.has_variants) {
      setSelectedProduct(result.product)
      setVariantDialogOpen(true)
    } else {
      // Fetch stock for simple products
      let availableStock = 0
      if (locationId) {
        const stockResult = await getProductStock(result.product.id, locationId)
        availableStock = stockResult.available_quantity
      }
      onAddToCart(result.product, undefined, availableStock)
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

      <InstantSearch
        searchClient={searchClient}
        indexName={ALGOLIA_INDEXES.products}
        future={{ preserveSharedStateOnUnmount: true }}
      >
        <Configure filters={filters} hitsPerPage={50} />
        <SearchQuerySyncer query={searchQuery} />
        <POSProductHitsInline onProductClick={handleProductClick} />
      </InstantSearch>

      {/* Variant Selection Dialog */}
      <VariantDialog
        open={variantDialogOpen}
        onOpenChange={setVariantDialogOpen}
        product={selectedProduct}
        locationId={locationId}
        onSelect={(variant, availableStock) => {
          if (selectedProduct) {
            onAddToCart(selectedProduct, variant, availableStock)
          }
          setVariantDialogOpen(false)
        }}
      />
    </div>
  )
}

function SearchQuerySyncer({ query }: { query: string }) {
  const { refine } = useSearchBox()

  useEffect(() => {
    refine(query)
  }, [query, refine])

  return null
}

function POSProductHitsInline({ onProductClick }: { onProductClick: (product: AlgoliaProduct) => void }) {
  const { hits } = useHits<AlgoliaProduct>()
  const { status } = useInstantSearch()

  const loading = status === "loading" || status === "stalled"

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    )
  }

  if (hits.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-12">
        <Package className="h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-lg font-medium">No products found</p>
        <p className="text-sm text-muted-foreground">Try a different search or category</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 overflow-y-auto flex-1">
      {hits.map((product) => (
        <Card
          key={product.objectID}
          className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
          onClick={() => onProductClick(product)}
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
  )
}

interface VariantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  locationId?: string
  onSelect: (variant: ProductVariant, availableStock: number) => void
}

function VariantDialog({ open, onOpenChange, product, locationId, onSelect }: VariantDialogProps) {
  const [variantStocks, setVariantStocks] = useState<Record<string, number>>({})
  const [loadingStocks, setLoadingStocks] = useState(false)

  const { data: variantsData, isLoading } = useSWR(product && open ? ["variants", product.id] : null, async () => {
    if (!product) return { variants: [] }
    const result = await getProductVariants(product.id)
    return result
  })

  const variants = variantsData?.variants || []

  useEffect(() => {
    async function fetchStocks() {
      if (!variants.length || !locationId) return
      setLoadingStocks(true)

      const stocks: Record<string, number> = {}
      for (const variant of variants) {
        const result = await getVariantStock(variant.id, locationId)
        stocks[variant.id] = result.available_quantity
      }

      setVariantStocks(stocks)
      setLoadingStocks(false)
    }

    if (open && variants.length > 0 && locationId) {
      fetchStocks()
    }
  }, [open, variants, locationId])

  const getStockBadge = (variantId: string) => {
    const stock = variantStocks[variantId]
    if (stock === undefined) return null

    if (stock <= 0) {
      return (
        <Badge variant="destructive" className="ml-2">
          Out of stock
        </Badge>
      )
    } else if (stock <= 5) {
      return (
        <Badge variant="destructive" className="ml-2">
          Low: {stock}
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="ml-2">
        {stock} in stock
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Variant - {product?.name}</DialogTitle>
        </DialogHeader>

        {isLoading || loadingStocks ? (
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
              .map((variant) => {
                const stock = variantStocks[variant.id] ?? 0
                const isOutOfStock = stock <= 0

                return (
                  <Button
                    key={variant.id}
                    variant="outline"
                    className={`h-auto w-full justify-between p-4 bg-transparent ${isOutOfStock ? "opacity-50" : ""}`}
                    onClick={() => onSelect(variant, stock)}
                    disabled={isOutOfStock}
                  >
                    <div className="text-left">
                      <div className="flex items-center">
                        <p className="font-medium">
                          {variant.option_values ? Object.values(variant.option_values).join(" / ") : variant.sku}
                        </p>
                        {getStockBadge(variant.id)}
                      </div>
                      <p className="text-xs text-muted-foreground">{variant.sku}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {formatCurrency(variant.selling_price || product?.selling_price || 0)}
                      </span>
                      {!isOutOfStock && <Plus className="h-4 w-4" />}
                      {isOutOfStock && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    </div>
                  </Button>
                )
              })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
