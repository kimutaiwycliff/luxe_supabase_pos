"use client"

import Image from "next/image"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Combobox } from "@/components/ui/combobox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createProduct, updateProduct } from "@/lib/actions/products"
import type { Product, Category, Supplier } from "@/lib/types"
import { Loader2, X, Star, ImagePlus } from "lucide-react"
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/dropzone"
import { useSupabaseUpload } from "@/hooks/use-supabase-upload"

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  categories: Category[]
  suppliers: Supplier[]
  onSuccess: () => void
}

export function ProductDialog({ open, onOpenChange, product, categories, suppliers, onSuccess }: ProductDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // allImages[0] = primary/hero, rest = gallery. Flat array is the source of truth.
  const [allImages, setAllImages] = useState<string[]>([])

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: "",
    supplier_id: "",
    brand: "",
    cost_price: 0,
    selling_price: 0,
    compare_at_price: 0,
    tax_rate: 0,
    is_active: true,
    is_featured: false,
    has_variants: false,
    track_inventory: true,
    allow_backorder: false,
    low_stock_threshold: 5,
  })

  const uploadProps = useSupabaseUpload({
    bucketName: "products",
    path: "images",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    maxFiles: 10,
    maxFileSize: 5 * 1024 * 1024,
    onUploadComplete: (urls) => {
      setAllImages((prev) => [...prev, ...urls])
    },
  })

  const { reset: resetUpload } = uploadProps

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || "",
        category_id: product.category_id || "",
        supplier_id: product.supplier_id || "",
        brand: product.brand || "",
        cost_price: product.cost_price,
        selling_price: product.selling_price,
        compare_at_price: product.compare_at_price || 0,
        tax_rate: product.tax_rate,
        is_active: product.is_active,
        is_featured: product.is_featured,
        has_variants: product.has_variants,
        track_inventory: product.track_inventory,
        allow_backorder: product.allow_backorder,
        low_stock_threshold: product.low_stock_threshold,
      })
      setAllImages([...(product.image_url ? [product.image_url] : []), ...(product.gallery_paths ?? [])])
    } else {
      setFormData({
        name: "",
        description: "",
        category_id: "",
        supplier_id: "",
        brand: "",
        cost_price: 0,
        selling_price: 0,
        compare_at_price: 0,
        tax_rate: 0,
        is_active: true,
        is_featured: false,
        has_variants: false,
        track_inventory: true,
        allow_backorder: false,
        low_stock_threshold: 5,
      })
      setAllImages([])
    }
    setError(null)
    setError(null)
    resetUpload()
  }, [product, open, resetUpload])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const submitData = {
        ...formData,
        image_url: allImages[0] ?? undefined,
        gallery_paths: allImages.slice(1),
      }
      const result = product ? await updateProduct(product.id, submitData) : await createProduct(submitData)

      if (result.error) {
        setError(result.error)
      } else {
        onSuccess()
      }
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveImage = (idx: number) => {
    setAllImages((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSetPrimary = (idx: number) => {
    setAllImages((prev) => {
      const next = [...prev]
      const [item] = next.splice(idx, 1)
      next.unshift(item)
      return next
    })
  }

  const profit = formData.selling_price - formData.cost_price
  const margin = formData.selling_price > 0 ? (profit / formData.selling_price) * 100 : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add New Product"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="image">Image</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Silk Blouse"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g., Gucci"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Product description..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Combobox
                  options={categories.map((cat) => ({
                    label: cat.name,
                    value: cat.id,
                  }))}
                  value={formData.category_id}
                  onSelect={(value) => setFormData({ ...formData, category_id: value })}
                  placeholder="Select category"
                  searchPlaceholder="Search category..."
                  emptyText="No category found."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Combobox
                  options={(suppliers || []).map((supplier) => ({
                    label: supplier.name,
                    value: supplier.id,
                  }))}
                  value={formData.supplier_id || ""}
                  onSelect={(value) => setFormData({ ...formData, supplier_id: value })}
                  placeholder="Select supplier (optional)"
                  searchPlaceholder="Search supplier..."
                  emptyText="No supplier found."
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium">Active</p>
                  <p className="text-sm text-muted-foreground">Product will be visible in POS</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium">Featured</p>
                  <p className="text-sm text-muted-foreground">Show in featured products</p>
                </div>
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
              </div>
            </TabsContent>

            <TabsContent value="image" className="mt-4 space-y-4">
              {/* Existing images grid */}
              {allImages.length > 0 && (
                <div className="space-y-2">
                  <Label>Product Images</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {allImages.map((src, idx) => (
                      <div key={src + idx} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                        <Image src={src} alt={`Image ${idx + 1}`} fill className="object-cover" />
                        {/* Primary badge */}
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 flex items-center gap-0.5 bg-accent text-accent-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                            <Star className="h-2.5 w-2.5 fill-current" />
                            Primary
                          </span>
                        )}
                        {/* Overlay actions */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                          {idx !== 0 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="h-7 text-xs px-2"
                              onClick={() => handleSetPrimary(idx)}
                            >
                              <Star className="h-3 w-3 mr-1" />
                              Set Primary
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="h-7 w-7"
                            onClick={() => handleRemoveImage(idx)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The image marked <strong>Primary</strong> appears on product cards and social previews. Hover an image to reorder or delete it.
                  </p>
                </div>
              )}

              {/* Upload new images */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <ImagePlus className="h-4 w-4" />
                  {allImages.length === 0 ? "Add Images" : "Add More Images"}
                </Label>
                <Dropzone {...uploadProps}>
                  {uploadProps.files.length === 0 && <DropzoneEmptyState />}
                  <DropzoneContent />
                </Dropzone>
                <p className="text-xs text-muted-foreground">
                  Upload up to 10 images. Recommended 800×800 px, max 5 MB each. First image becomes the primary.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cost_price">Cost Price (KES) *</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: Number.parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="selling_price">Selling Price (KES) *</Label>
                  <Input
                    id="selling_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={(e) =>
                      setFormData({ ...formData, selling_price: Number.parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="compare_at_price">Compare at Price (KES)</Label>
                  <Input
                    id="compare_at_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.compare_at_price}
                    onChange={(e) =>
                      setFormData({ ...formData, compare_at_price: Number.parseFloat(e.target.value) || 0 })
                    }
                  />
                  <p className="text-xs text-muted-foreground">Original price for showing discounts</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                  <Input
                    id="tax_rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({ ...formData, tax_rate: Number.parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="rounded-lg bg-secondary p-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Profit per unit</span>
                  <span className={`font-semibold ${profit >= 0 ? "text-success" : "text-destructive"}`}>
                    KES {profit.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-muted-foreground">Profit margin</span>
                  <span className={`font-semibold ${margin >= 0 ? "text-success" : "text-destructive"}`}>
                    {margin.toFixed(1)}%
                  </span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="inventory" className="mt-4 space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium">Track Inventory</p>
                  <p className="text-sm text-muted-foreground">Keep track of stock quantities</p>
                </div>
                <Switch
                  checked={formData.track_inventory}
                  onCheckedChange={(checked) => setFormData({ ...formData, track_inventory: checked })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium">Allow Backorder</p>
                  <p className="text-sm text-muted-foreground">Allow sales when out of stock</p>
                </div>
                <Switch
                  checked={formData.allow_backorder}
                  onCheckedChange={(checked) => setFormData({ ...formData, allow_backorder: checked })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium">Has Variants</p>
                  <p className="text-sm text-muted-foreground">Product has size, color, etc.</p>
                </div>
                <Switch
                  checked={formData.has_variants}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_variants: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
                <Input
                  id="low_stock_threshold"
                  type="number"
                  min="0"
                  value={formData.low_stock_threshold}
                  onChange={(e) =>
                    setFormData({ ...formData, low_stock_threshold: Number.parseInt(e.target.value) || 0 })
                  }
                />
                <p className="text-xs text-muted-foreground">Alert when stock falls below this number</p>
              </div>
            </TabsContent>
          </Tabs>

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {product ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
