"use client"

import { useHits, useInstantSearch } from "react-instantsearch"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/format"
import { Package, Filter, Trash2, Check } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { AlgoliaProduct } from "@/lib/algolia"

interface ProductHitsProps {
  viewMode: "grid" | "list"
  onOpen: (product: AlgoliaProduct) => void
  onDelete?: (product: AlgoliaProduct) => void
  onAdd?: () => void
  selectedIds?: Set<string>
  onToggleSelect?: (product: AlgoliaProduct) => void
}

export function ProductHits({ viewMode, onOpen, onDelete, onAdd, selectedIds, onToggleSelect }: ProductHitsProps) {
  const { hits } = useHits<AlgoliaProduct>()
  const { status } = useInstantSearch()

  const loading = status === "loading" || status === "stalled"

  if (loading) {
    return (
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-60 rounded-xl" />
        ))}
      </div>
    )
  }

  if (hits.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border">
        <Filter className="h-10 w-10 text-muted-foreground" />
        <p className="mt-4 text-lg font-medium">No products found</p>
        <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
        {onAdd && (
          <Button className="mt-4" onClick={onAdd}>
            Add Product
          </Button>
        )}
      </div>
    )
  }

  if (viewMode === "grid") {
    return (
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {hits.map((product) => {
          const isSelected = selectedIds?.has(product.objectID) ?? false
          return (
            <Card
              key={product.objectID}
              className={cn(
                "group overflow-hidden cursor-pointer hover:border-primary/60 hover:shadow-md transition-all duration-150 active:scale-[0.98]",
                isSelected && "ring-2 ring-primary border-primary"
              )}
              onClick={() => onOpen(product)}
            >
              <div className="relative aspect-square bg-secondary">
                {product.image_url ? (
                  <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                  {!onToggleSelect && (
                    <Badge variant={product.is_active ? "default" : "secondary"} className="text-[10px] px-1.5 py-0 shadow-sm">
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                  )}
                  {product.has_variants && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-background/80 shadow-sm">
                      Variants
                    </Badge>
                  )}
                </div>

                {/* Selection checkbox — top-left, stopPropagation */}
                {onToggleSelect && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(product) }}
                    className={cn(
                      "absolute top-2 left-2 h-5 w-5 rounded border-2 flex items-center justify-center transition-all duration-150",
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-background/80 border-border opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                    )}
                    aria-label={isSelected ? "Deselect" : "Select"}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </button>
                )}

                {/* Quick-delete */}
                {onDelete && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDelete(product) }}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-white hover:border-destructive transition-all duration-150"
                    aria-label="Delete product"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <CardContent className="p-3">
                <h3 className="font-medium text-sm leading-snug truncate">{product.name}</h3>
                <p className="text-[11px] text-muted-foreground truncate">{product.sku}</p>
                {product.category_name && (
                  <p className="text-[11px] text-muted-foreground truncate">{product.category_name}</p>
                )}
                <p className="mt-1.5 font-semibold text-sm text-primary">{formatCurrency(product.selling_price)}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  // List view
  return (
    <div className="space-y-1.5">
      {hits.map((product) => {
        const isSelected = selectedIds?.has(product.objectID) ?? false
        return (
          <div
            key={product.objectID}
            onClick={() => onOpen(product)}
            className={cn(
              "group flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all duration-150 active:bg-muted/50",
              isSelected && "border-primary bg-primary/5"
            )}
          >
            {/* Selection checkbox — list mode */}
            {onToggleSelect && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleSelect(product) }}
                className={cn(
                  "shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-all duration-150",
                  isSelected
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border hover:border-primary"
                )}
                aria-label={isSelected ? "Deselect" : "Select"}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </button>
            )}

            {/* Thumbnail */}
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
              {product.image_url ? (
                <Image src={product.image_url} alt={product.name} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Package className="h-5 w-5 text-muted-foreground/30" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-medium text-sm truncate">{product.name}</p>
                {product.has_variants && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">Variants</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {product.sku}{product.category_name ? ` · ${product.category_name}` : ""}
              </p>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <p className="font-semibold text-sm text-primary">{formatCurrency(product.selling_price)}</p>
                <p className="text-xs text-muted-foreground hidden sm:block">Cost: {formatCurrency(product.cost_price)}</p>
              </div>
              <Badge variant={product.is_active ? "default" : "secondary"} className="text-[10px] px-1.5 hidden sm:flex">
                {product.is_active ? "Active" : "Inactive"}
              </Badge>
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(product) }}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all duration-150"
                  aria-label="Delete product"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
