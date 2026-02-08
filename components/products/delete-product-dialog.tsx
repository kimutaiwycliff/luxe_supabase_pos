"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Product } from "@/lib/types"
import type { AlgoliaProduct } from "@/lib/algolia"
import { AlertTriangle, Loader2 } from "lucide-react"
import Image from "next/image"

interface DeleteProductDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    product: Product | AlgoliaProduct | null
    onConfirm: () => void
    isDeleting: boolean
}

export function DeleteProductDialog({ open, onOpenChange, product, onConfirm, isDeleting }: DeleteProductDialogProps) {
    if (!product) return null

    // Helper to safely get category name whether it's Product or AlgoliaProduct
    const getCategoryName = () => {
        if ("category" in product) {
            return (product as Product).category?.name;
        }
        return (product as AlgoliaProduct).category_name;
    }

    const categoryName = getCategoryName();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                        <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <DialogTitle className="text-center">Delete Product</DialogTitle>
                    <DialogDescription className="text-center">
                        Are you sure you want to delete this product? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <div className="my-4 rounded-lg bg-muted/50 p-4">
                    <div className="flex items-start gap-4">
                        <div className="relative h-16 w-16 overflow-hidden rounded-md border bg-background">
                            {product.image_url ? (
                                <Image
                                    src={product.image_url || "/placeholder.svg"}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center bg-secondary text-lg font-bold text-muted-foreground">
                                    {product.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 space-y-1">
                            <p className="font-medium leading-none">{product.name}</p>
                            <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                            <div className="flex items-center gap-2 pt-1">
                                <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-500/10">
                                    {categoryName || "Uncategorized"}
                                </span>
                                {product.has_variants && (
                                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/20 dark:text-blue-400">
                                        Variants
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="sm:justify-center gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting} className="w-full sm:w-auto">
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            "Delete Product"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
