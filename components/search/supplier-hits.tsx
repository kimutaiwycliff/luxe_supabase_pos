"use client"

import { useHits, useInstantSearch } from "react-instantsearch"
import { Phone, Mail, MapPin, Pencil, Trash2, Truck, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { AlgoliaSupplier } from "@/lib/algolia"

interface SupplierHitsProps {
  onEdit: (supplier: AlgoliaSupplier) => void
  onDelete: (supplierId: string, supplierName: string) => void
}

export function SupplierHits({ onEdit, onDelete }: SupplierHitsProps) {
  const { hits } = useHits<AlgoliaSupplier>()
  const { status } = useInstantSearch()

  const loading = status === "loading" || status === "stalled"

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    )
  }

  if (hits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-border gap-3">
        <Truck className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No suppliers found</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {hits.map((supplier) => (
        <Card
          key={supplier.objectID}
          className="relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow active:bg-muted/20"
          onClick={() => onEdit(supplier)}
        >
          {/* Header */}
          <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate leading-tight">{supplier.name}</p>
              {supplier.contact_person && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{supplier.contact_person}</p>
              )}
            </div>
            <Badge
              variant={supplier.is_active ? "default" : "secondary"}
              className="flex-shrink-0 text-[10px] px-1.5"
            >
              {supplier.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>

          {/* Contact info */}
          <CardContent className="px-4 pb-3 pt-0 space-y-1.5">
            {supplier.phone && (
              <a
                href={`tel:${supplier.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{supplier.phone}</span>
              </a>
            )}
            {supplier.email && (
              <a
                href={`mailto:${supplier.email}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{supplier.email}</span>
              </a>
            )}
            {supplier.address && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <span className="truncate">{supplier.address}</span>
              </div>
            )}
            {supplier.lead_time_days != null && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{supplier.lead_time_days} day lead time</span>
              </div>
            )}
          </CardContent>

          {/* Action row */}
          <div
            className="px-4 pb-4 pt-2 border-t border-border/60 flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-9 text-sm"
              onClick={() => onEdit(supplier)}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(supplier.objectID, supplier.name)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
