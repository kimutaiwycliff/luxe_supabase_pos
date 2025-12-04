"use client"

import { useHits, useInstantSearch } from "react-instantsearch"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import { Package } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { AlgoliaProduct } from "@/lib/algolia"

interface POSProductHitsProps {
  onProductClick: (product: AlgoliaProduct) => void
}

export function POSProductHits({ onProductClick }: POSProductHitsProps) {
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
        <p className="text-sm text-muted-foreground">Try a different search term</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {hits.map((product) => (
        <Card
          key={product.objectID}
          className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
          onClick={() => onProductClick(product)}
        >
          <CardContent className="p-3">
            <div className="relative mb-2 aspect-square overflow-hidden rounded-lg bg-secondary">
              {product.image_path ? (
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
