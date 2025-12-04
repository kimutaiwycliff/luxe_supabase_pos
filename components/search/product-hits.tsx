"use client"

import { useHits, useInstantSearch } from "react-instantsearch"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/format"
import { Package, Filter } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { AlgoliaProduct } from "@/lib/algolia"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Trash2, Layers } from "lucide-react"

interface ProductHitsProps {
  viewMode: "grid" | "list"
  onEdit?: (product: AlgoliaProduct) => void
  onEditVariants?: (product: AlgoliaProduct) => void
  onDelete?: (productId: string) => void
  onAdd?: () => void
  isLoading?: boolean
}

export function ProductHits({ viewMode, onEdit, onEditVariants, onDelete, onAdd, isLoading }: ProductHitsProps) {
  const { hits } = useHits<AlgoliaProduct>()
  const { status } = useInstantSearch()

  const loading = status === "loading" || status === "stalled" || isLoading

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    )
  }

  if (hits.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border">
        <Filter className="h-10 w-10 text-muted-foreground" />
        <p className="mt-4 text-lg font-medium text-foreground">No products found</p>
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {hits.map((product) => (
          <Card key={product.objectID} className="overflow-hidden">
            <div className="relative aspect-square bg-secondary">
              {product.image_url ? (
                <Image
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Package className="h-12 w-12 text-muted-foreground/30" />
                </div>
              )}
              {product.has_variants && (
                <Badge className="absolute bottom-2 right-2" variant="secondary">
                  Variants
                </Badge>
              )}
            </div>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">{product.sku}</p>
                  {product.category_name && (
                    <Badge variant="outline" className="mt-1">
                      {product.category_name}
                    </Badge>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(product)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {product.has_variants && onEditVariants && (
                      <DropdownMenuItem onClick={() => onEditVariants(product)}>
                        <Layers className="mr-2 h-4 w-4" />
                        Edit Variants
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem onClick={() => onDelete(product.objectID)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-semibold text-primary">{formatCurrency(product.selling_price)}</span>
                <Badge variant={product.is_active ? "default" : "secondary"}>
                  {product.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // List view
  return (
    <div className="space-y-2">
      {hits.map((product) => (
        <Card key={product.objectID} className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
              {product.image_url ? (
                <Image
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Package className="h-6 w-6 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium truncate">{product.name}</h3>
                {product.has_variants && (
                  <Badge variant="secondary" className="shrink-0">
                    Variants
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {product.sku} • {product.category_name || "Uncategorized"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-primary">{formatCurrency(product.selling_price)}</p>
              <p className="text-sm text-muted-foreground">Cost: {formatCurrency(product.cost_price)}</p>
            </div>
            <Badge variant={product.is_active ? "default" : "secondary"}>
              {product.is_active ? "Active" : "Inactive"}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(product)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {product.has_variants && onEditVariants && (
                  <DropdownMenuItem onClick={() => onEditVariants(product)}>
                    <Layers className="mr-2 h-4 w-4" />
                    Edit Variants
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={() => onDelete(product.objectID)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Card>
      ))}
    </div>
  )
}
