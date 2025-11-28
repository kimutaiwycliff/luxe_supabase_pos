"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatCurrency } from "@/lib/format"
import { MoreVertical, Edit, Trash2, Copy, Eye } from "lucide-react"
import { deleteProduct } from "@/lib/actions/products"
import type { Product } from "@/lib/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: () => void
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteProduct(product.id)
    setIsDeleting(false)

    if (result.success) {
      setDeleteDialogOpen(false)
      onDelete()
    }
  }

  const profit = product.selling_price - product.cost_price
  const margin = (profit / product.selling_price) * 100

  return (
    <>
      <Card className="group overflow-hidden transition-all hover:border-primary/50">
        <div className="relative aspect-square bg-secondary">
          {product.image_url ? (
            <Image src={product.image_url || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-4xl text-muted-foreground/50">{product.name.charAt(0)}</span>
            </div>
          )}

          <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(product)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteDialogOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="absolute left-2 top-2">
            <StatusBadge status={product.is_active ? "active" : "inactive"} />
          </div>
        </div>

        <CardContent className="p-4">
          <div className="mb-1 flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-medium text-foreground">{product.name}</h3>
              <p className="text-xs text-muted-foreground">{product.sku}</p>
            </div>
          </div>

          {product.category && <p className="mb-2 text-xs text-muted-foreground">{product.category.name}</p>}

          <div className="flex items-end justify-between">
            <div>
              <p className="text-lg font-semibold text-foreground">{formatCurrency(product.selling_price)}</p>
              <p className="text-xs text-muted-foreground">Cost: {formatCurrency(product.cost_price)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-success">{formatCurrency(profit)}</p>
              <p className="text-xs text-muted-foreground">{margin.toFixed(0)}% margin</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{product.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
