"use client"

import { useState } from "react"
import useSWR from "swr"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getProductVariants, getProductById } from "@/lib/actions/products"
import { getCategories } from "@/lib/actions/categories"
import { formatCurrency } from "@/lib/format"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus } from "lucide-react"
import type { Product, ProductVariant } from "@/lib/types"
import type { AlgoliaProduct } from "@/lib/algolia"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlgoliaProvider } from "@/components/search/algolia-provider"
import { POSProductHits } from "@/components/search/pos-product-hits"
import { ALGOLIA_INDEXES } from "@/lib/algolia-client"

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

  const categories = categoriesData?.categories || []

  // Build Algolia filters
  const buildFilters = () => {
    const filters: string[] = ["is_active:true"]
    if (selectedCategory !== "all") {
      filters.push(`category_id:${selectedCategory}`)
    }
    return filters.join(" AND ")
  }

  const handleProductClick = async (algoliaProduct: AlgoliaProduct) => {
    // Fetch full product data
    const result = await getProductById(algoliaProduct.objectID)
    if (!result.product) return

    if (result.product.has_variants) {
      setSelectedProduct(result.product)
      setVariantDialogOpen(true)
    } else {
      onAddToCart(result.product)
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

      {/* Product Grid with Algolia */}
      <AlgoliaProvider indexName={ALGOLIA_INDEXES.products} filters={buildFilters()} hitsPerPage={50}>
        {/* Inject search query into Algolia */}
        <AlgoliaSearchInjector query={searchQuery} />
        <POSProductHits onProductClick={handleProductClick} />
      </AlgoliaProvider>

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

// Component to inject search query into Algolia
import { useSearchBox } from "react-instantsearch"
import { useEffect } from "react"

function AlgoliaSearchInjector({ query }: { query: string }) {
  const { refine } = useSearchBox()

  useEffect(() => {
    refine(query)
  }, [query, refine])

  return null
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
                    <p className="font-medium">
                      {variant.option_values ? Object.values(variant.option_values).join(" / ") : variant.sku}
                    </p>
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
