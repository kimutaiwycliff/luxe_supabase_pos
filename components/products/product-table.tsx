"use client"

import { useState } from "react"
import Image from "next/image"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/ui/status-badge"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
import { formatCurrency } from "@/lib/format"
import { MoreVertical, Edit, Trash2, Copy } from "lucide-react"
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

interface ProductTableProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: () => void
  isLoading?: boolean
}

export function ProductTable({ products, onEdit, onDelete, isLoading }: ProductTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!productToDelete) return

    setIsDeleting(true)
    const result = await deleteProduct(productToDelete.id)
    setIsDeleting(false)

    if (result.success) {
      setDeleteDialogOpen(false)
      setProductToDelete(null)
      onDelete()
    }
  }

  const columns: ColumnDef<Product>[] = [
    {
      id: "image",
      header: "",
      cell: ({ row }) => {
        const product = row.original
        return (
          <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-secondary">
            {product.image_url ? (
              <Image src={product.image_url || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {product.name.charAt(0)}
              </div>
            )}
          </div>
        )
      },
      enableSorting: false,
      enableHiding: false,
      meta: { className: "w-12" },
    },
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
      cell: ({ row }) => {
        const product = row.original
        return (
          <div>
            <p className="font-medium">{product.name}</p>
            {product.brand && <p className="text-xs text-muted-foreground">{product.brand}</p>}
          </div>
        )
      },
    },
    {
      accessorKey: "sku",
      header: ({ column }) => <DataTableColumnHeader column={column} title="SKU" />,
      cell: ({ row }) => <span className="font-mono text-sm">{row.getValue("sku")}</span>,
    },
    {
      accessorKey: "category",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
      cell: ({ row }) => {
        const product = row.original
        return product.category?.name || "-"
      },
      filterFn: (row, id, value) => {
        return row.original.category?.name?.toLowerCase().includes(value.toLowerCase()) ?? false
      },
    },
    {
      accessorKey: "cost_price",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Cost" className="justify-end" />,
      cell: ({ row }) => <div className="text-right">{formatCurrency(row.getValue("cost_price"))}</div>,
      meta: { className: "text-right" },
    },
    {
      accessorKey: "selling_price",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Price" className="justify-end" />,
      cell: ({ row }) => <div className="text-right font-medium">{formatCurrency(row.getValue("selling_price"))}</div>,
      meta: { className: "text-right" },
    },
    {
      id: "margin",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Margin" className="justify-end" />,
      accessorFn: (row) => {
        const profit = row.selling_price - row.cost_price
        return (profit / row.selling_price) * 100
      },
      cell: ({ row }) => {
        const margin = row.getValue("margin") as number
        return <div className="text-right text-success">{margin.toFixed(0)}%</div>
      },
      meta: { className: "text-right" },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("is_active") ? "active" : "inactive"} />,
      filterFn: (row, id, value) => {
        if (value === "all") return true
        return value === "active" ? row.getValue(id) === true : row.getValue(id) === false
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const product = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
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
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(product)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableSorting: false,
      enableHiding: false,
      meta: { className: "w-12" },
    },
  ]

  return (
    <>
      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        searchPlaceholder="Search products..."
        emptyMessage="No products found"
        emptyDescription="Add products to get started"
        showSearch={false}
        pageSize={20}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{productToDelete?.name}&quot;? This action cannot be undone.
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
