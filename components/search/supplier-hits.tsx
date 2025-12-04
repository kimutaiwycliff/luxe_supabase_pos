"use client"

import { useHits, useInstantSearch } from "react-instantsearch"
import { Phone, Mail, MapPin, MoreHorizontal, Pencil, Trash2, Truck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { AlgoliaSupplier } from "@/lib/algolia"

interface SupplierHitsProps {
  onEdit: (supplier: AlgoliaSupplier) => void
  onDelete: (supplierId: string) => void
}

export function SupplierHits({ onEdit, onDelete }: SupplierHitsProps) {
  const { hits } = useHits<AlgoliaSupplier>()
  const { status } = useInstantSearch()

  const loading = status === "loading" || status === "stalled"

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    )
  }

  if (hits.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Truck className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No suppliers found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {hits.map((supplier) => (
        <Card key={supplier.objectID} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{supplier.name}</CardTitle>
                {supplier.contact_person && <p className="text-sm text-muted-foreground">{supplier.contact_person}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={supplier.is_active ? "default" : "secondary"}>
                  {supplier.is_active ? "Active" : "Inactive"}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(supplier)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(supplier.objectID)} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {supplier.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${supplier.email}`} className="text-primary hover:underline">
                  {supplier.email}
                </a>
              </div>
            )}
            {supplier.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${supplier.phone}`} className="hover:underline">
                  {supplier.phone}
                </a>
              </div>
            )}
            {supplier.address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">{supplier.address}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-3 border-t">
              {supplier.lead_time_days && (
                <span className="text-sm text-muted-foreground">{supplier.lead_time_days} days lead time</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
