"use client"

import Image from "next/image"
import type React from "react"
import { useState, useEffect, useMemo } from "react"
import useSWR from "swr"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Combobox } from "@/components/ui/combobox"
import {
  Loader2, Plus, Pencil, Trash2, Save, X, Star, ImagePlus, Printer, Package, Barcode,
  Copy, Check, ShoppingCart,
} from "lucide-react"
import { createProduct, updateProduct } from "@/lib/actions/products"
import {
  getProductVariants,
  updateVariant,
  updateVariantInventory,
  createVariant,
  deleteVariant,
  type ProductVariant,
} from "@/lib/actions/variants"
import { getDefaultLocation } from "@/lib/actions/locations"
import { formatCurrency } from "@/lib/format"
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/dropzone"
import { useSupabaseUpload } from "@/hooks/use-supabase-upload"
import { PrintLabelsDialog, type LabelItem } from "@/components/products/print-labels-dialog"
import type { Product, Category, Supplier } from "@/lib/types"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ProductDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  categories: Category[]
  suppliers: Supplier[]
  onSuccess: () => void
  onRestock?: (product: Product) => void
}

// ── Barcode copy button ──────────────────────────────────────────────────────
function BarcodeCopy({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
      {value}
    </button>
  )
}

// ── Variant image uploader ──────────────────────────────────────────────────
function VariantImageUploader({ onUploaded }: { onUploaded: (urls: string[]) => void }) {
  const uploadProps = useSupabaseUpload({
    bucketName: "products",
    path: "images",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    maxFiles: 5,
    maxFileSize: 5 * 1024 * 1024,
    onUploadComplete: (urls) => { onUploaded(urls); uploadProps.reset() },
  })
  return (
    <Dropzone {...uploadProps}>
      {uploadProps.files.length === 0 && <DropzoneEmptyState />}
      <DropzoneContent />
    </Dropzone>
  )
}

// ── Main component ──────────────────────────────────────────────────────────
export function ProductDetailSheet({
  open,
  onOpenChange,
  product,
  categories,
  suppliers,
  onSuccess,
  onRestock,
}: ProductDetailSheetProps) {
  // ── Product form state ──────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
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
    tax_rate: 16,
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
    onUploadComplete: (urls) => setAllImages((prev) => [...prev, ...urls]),
  })

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
        tax_rate: product.tax_rate || 16,
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
        name: "", description: "", category_id: "", supplier_id: "", brand: "",
        cost_price: 0, selling_price: 0, compare_at_price: 0, tax_rate: 16,
        is_active: true, is_featured: false, has_variants: false,
        track_inventory: true, allow_backorder: false, low_stock_threshold: 5,
      })
      setAllImages([])
    }
    setFormError(null)
    uploadProps.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, open])

  const handleSaveProduct = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!formData.name) { setFormError("Product name is required"); return }
    setIsSaving(true); setFormError(null)
    try {
      const payload = { ...formData, image_url: allImages[0] ?? undefined, gallery_paths: allImages.slice(1) }
      const result = product ? await updateProduct(product.id, payload) : await createProduct(payload)
      if (result.error) { setFormError(result.error) }
      else { toast.success(product ? "Product updated" : "Product created"); onSuccess() }
    } catch { setFormError("An unexpected error occurred") }
    finally { setIsSaving(false) }
  }

  // ── Variant state ──────────────────────────────────────────────────
  const { data: variantsData, mutate: mutateVariants } = useSWR(
    open && product ? ["product-variants", product.id] : null,
    () => getProductVariants(product!.id),
  )
  const variants = useMemo(() => variantsData?.variants || [], [variantsData])

  const [locationId, setLocationId] = useState<string | null>(null)
  useEffect(() => {
    if (open) getDefaultLocation().then((r) => r.location && setLocationId(r.location.id))
  }, [open])

  const [editingVariantId, setEditingVariantId] = useState<string | null>(null)
  const [variantEditForm, setVariantEditForm] = useState<{
    cost_price: number; selling_price: number; compare_at_price: number; tax_rate: number | null; is_active: boolean
  } | null>(null)
  const [inventoryForm, setInventoryForm] = useState<Record<string, number>>({})
  const [savingVariantId, setSavingVariantId] = useState<string | null>(null)
  const [savingInventoryId, setSavingInventoryId] = useState<string | null>(null)
  const [showAddVariant, setShowAddVariant] = useState(false)
  const [newVariant, setNewVariant] = useState({ name: "", cost_price: 0, selling_price: 0, compare_at_price: 0, tax_rate: 16 })

  // Per-variant images
  const [variantImages, setVariantImages] = useState<Record<string, string[]>>({})
  const [imageEditingId, setImageEditingId] = useState<string | null>(null)
  const [savingImagesId, setSavingImagesId] = useState<string | null>(null)

  useEffect(() => {
    if (variants.length > 0) {
      const inv: Record<string, number> = {}
      variants.forEach((v) => { inv[v.id] = v.inventory?.quantity ?? 0 })
      setInventoryForm(inv)
      setVariantImages((prev) => {
        const next = { ...prev }
        variants.forEach((v) => {
          if (!next[v.id]) next[v.id] = [...(v.image_path ? [v.image_path] : []), ...(v.gallery_paths ?? [])]
        })
        return next
      })
    }
  }, [variants])

  const startEditVariant = (v: ProductVariant) => {
    setEditingVariantId(v.id)
    setVariantEditForm({ cost_price: v.cost_price ?? 0, selling_price: v.selling_price ?? 0, compare_at_price: v.compare_at_price ?? 0, tax_rate: v.tax_rate, is_active: v.is_active })
  }

  const handleSaveVariant = async (variantId: string) => {
    if (!variantEditForm) return
    setSavingVariantId(variantId)
    const { error } = await updateVariant(variantId, variantEditForm)
    if (error) { toast.error("Error updating variant", { description: error }) }
    else { mutateVariants(); setEditingVariantId(null); setVariantEditForm(null); toast.success("Variant saved") }
    setSavingVariantId(null)
  }

  const handleSaveInventory = async (variantId: string) => {
    if (!locationId) { toast.error("No location available"); return }
    setSavingInventoryId(variantId)
    const qty = inventoryForm[variantId] ?? 0
    const { error } = await updateVariantInventory(variantId, locationId, qty)
    if (error) { toast.error(error) }
    else { mutateVariants(); toast.success(`Stock set to ${qty}`) }
    setSavingInventoryId(null)
  }

  const handleAddVariant = async () => {
    if (!newVariant.name || !product) return
    setSavingVariantId("new")
    const { error } = await createVariant(product.id, { ...newVariant })
    if (error) { toast.error("Error", { description: error }) }
    else {
      mutateVariants(); setShowAddVariant(false)
      setNewVariant({ name: "", cost_price: formData.cost_price, selling_price: formData.selling_price, compare_at_price: formData.compare_at_price, tax_rate: formData.tax_rate })
      toast.success("Variant added")
    }
    setSavingVariantId(null)
  }

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm("Delete this variant?")) return
    const { error } = await deleteVariant(variantId)
    if (error) { toast.error("Error", { description: error }) } else { mutateVariants(); toast.success("Variant deleted") }
  }

  const handleSaveVariantImages = async (variantId: string) => {
    setSavingImagesId(variantId)
    const imgs = variantImages[variantId] ?? []
    const { error } = await updateVariant(variantId, { image_path: imgs[0] ?? null, gallery_paths: imgs.slice(1) })
    if (error) { toast.error("Error saving images", { description: error }) }
    else { mutateVariants(); setImageEditingId(null); toast.success("Images saved") }
    setSavingImagesId(null)
  }

  // ── Print labels ──────────────────────────────────────────────────
  const [printOpen, setPrintOpen] = useState(false)
  const labelItems = useMemo<LabelItem[]>(() => {
    if (!product) return []
    if (variants.length === 0) {
      return [{ id: product.id, barcode: product.barcode, productName: product.name, variantName: null, price: product.selling_price }]
    }
    return variants.map((v) => ({
      id: v.id, barcode: v.barcode, productName: product.name, variantName: v.name, price: v.selling_price ?? product.selling_price,
    }))
  }, [product, variants])

  const profit = formData.selling_price - formData.cost_price
  const margin = formData.selling_price > 0 ? (profit / formData.selling_price) * 100 : 0

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          className="w-full sm:max-w-3xl flex flex-col p-0 gap-0"
          onInteractOutside={(e) => e.preventDefault()}
        >
          {/* ── Sticky header ── */}
          <SheetHeader className="flex-row items-center justify-between px-5 py-3.5 border-b gap-3 flex-shrink-0 pr-12">
            <div className="flex items-center gap-3 min-w-0">
              {allImages[0] && (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-border flex-shrink-0">
                  <Image src={allImages[0]} alt="" fill className="object-cover" />
                </div>
              )}
              <div className="min-w-0">
                <SheetTitle className="text-base truncate">{product ? formData.name || product.name : "New Product"}</SheetTitle>
                <div className="flex gap-1.5 mt-0.5">
                  <Badge variant={formData.is_active ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                    {formData.is_active ? "Active" : "Inactive"}
                  </Badge>
                  {formData.has_variants && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{variants.length} variants</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {product && (
                <Button size="sm" variant="outline" onClick={() => setPrintOpen(true)}>
                  <Printer className="h-3.5 w-3.5 mr-1.5" />
                  Print Labels
                </Button>
              )}
              {product && onRestock && (
                <Button size="sm" variant="outline" onClick={() => onRestock(product)}>
                  <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                  Restock
                </Button>
              )}
              <Button size="sm" onClick={handleSaveProduct} disabled={isSaving}>
                {isSaving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Save
              </Button>
            </div>
          </SheetHeader>

          {/* ── Tabs + scrollable body ── */}
          <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="flex-shrink-0 rounded-none border-b bg-muted/40 px-4 justify-start gap-1 h-10">
              <TabsTrigger value="details" className="text-sm">Details</TabsTrigger>
              <TabsTrigger value="variants" className="text-sm" disabled={!formData.has_variants && variants.length === 0}>
                Variants {variants.length > 0 ? `(${variants.length})` : ""}
              </TabsTrigger>
              <TabsTrigger value="images" className="text-sm">Images</TabsTrigger>
            </TabsList>

            {/* ── Details tab ── */}
            <TabsContent value="details" className="flex-1 overflow-y-auto mt-0 px-5 py-5 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Product Name *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Silk Blouse" />
                </div>
                <div className="space-y-1.5">
                  <Label>Brand</Label>
                  <Input value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} placeholder="e.g., Zara" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="Product description..." />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Combobox options={categories.map((c) => ({ label: c.name, value: c.id }))} value={formData.category_id} onSelect={(v) => setFormData({ ...formData, category_id: v })} placeholder="Select category" searchPlaceholder="Search..." emptyText="No category found" />
                </div>
                <div className="space-y-1.5">
                  <Label>Supplier</Label>
                  <Combobox options={(suppliers || []).map((s) => ({ label: s.name, value: s.id }))} value={formData.supplier_id || ""} onSelect={(v) => setFormData({ ...formData, supplier_id: v })} placeholder="Select supplier" searchPlaceholder="Search..." emptyText="No supplier found" />
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pricing</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label>Cost Price (KES)</Label>
                    <Input type="number" min="0" step="0.01" value={formData.cost_price} onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Selling Price (KES)</Label>
                    <Input type="number" min="0" step="0.01" value={formData.selling_price} onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Compare at (KES)</Label>
                    <Input type="number" min="0" step="0.01" value={formData.compare_at_price} onChange={(e) => setFormData({ ...formData, compare_at_price: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="flex gap-6 rounded-lg bg-muted/50 px-4 py-3 text-sm">
                  <span>Margin: <strong className={cn(margin >= 0 ? "text-green-600" : "text-destructive")}>{margin.toFixed(1)}%</strong></span>
                  <span>Profit: <strong className={cn(profit >= 0 ? "text-green-600" : "text-destructive")}>KES {profit.toLocaleString()}</strong></span>
                  <div className="space-y-1.5 ml-auto flex items-center gap-2">
                    <Label>Tax %</Label>
                    <Input type="number" min="0" max="100" step="0.01" value={formData.tax_rate} onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })} className="w-20 h-7" />
                  </div>
                </div>
              </div>

              {/* Flags */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Settings</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {([
                    ["Active", "Visible in POS and webshop", "is_active"],
                    ["Featured", "Shown in featured sections", "is_featured"],
                    ["Has Variants", "Has sizes, colors, etc.", "has_variants"],
                    ["Track Inventory", "Monitor stock levels", "track_inventory"],
                    ["Allow Backorder", "Sell when out of stock", "allow_backorder"],
                  ] as [string, string, keyof typeof formData][]).map(([label, desc, key]) => (
                    <div key={key} className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5">
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                      <Switch checked={!!formData[key]} onCheckedChange={(v) => setFormData({ ...formData, [key]: v })} />
                    </div>
                  ))}
                  <div className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium">Low Stock Threshold</p>
                      <p className="text-xs text-muted-foreground">Alert below this quantity</p>
                    </div>
                    <Input type="number" min="0" value={formData.low_stock_threshold} onChange={(e) => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) || 0 })} className="w-20 h-8" />
                  </div>
                </div>
              </div>

              {formError && <p className="text-sm text-destructive">{formError}</p>}
            </TabsContent>

            {/* ── Variants tab ── */}
            <TabsContent value="variants" className="flex-1 overflow-y-auto mt-0 px-5 py-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{variants.length === 0 ? "No variants yet." : `${variants.length} variant${variants.length !== 1 ? "s" : ""}. Click a row to edit pricing or stock.`}</p>
                <Button size="sm" onClick={() => { setShowAddVariant(true); setNewVariant({ name: "", cost_price: formData.cost_price, selling_price: formData.selling_price, compare_at_price: formData.compare_at_price, tax_rate: formData.tax_rate }) }}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Variant
                </Button>
              </div>

              {showAddVariant && (
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                  <p className="text-sm font-medium">New Variant</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <div className="col-span-2 sm:col-span-1 space-y-1">
                      <Label className="text-xs">Name *</Label>
                      <Input value={newVariant.name} onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })} placeholder="e.g., Red / M" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Cost (KES)</Label>
                      <Input type="number" value={newVariant.cost_price} onChange={(e) => setNewVariant({ ...newVariant, cost_price: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Sell (KES)</Label>
                      <Input type="number" value={newVariant.selling_price} onChange={(e) => setNewVariant({ ...newVariant, selling_price: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Tax %</Label>
                      <Input type="number" value={newVariant.tax_rate} onChange={(e) => setNewVariant({ ...newVariant, tax_rate: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div className="flex items-end gap-1.5">
                      <Button size="sm" onClick={handleAddVariant} disabled={savingVariantId === "new" || !newVariant.name}>
                        {savingVariantId === "new" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowAddVariant(false)}><X className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </div>
              )}

              {variants.length > 0 && (
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="w-8" />
                        <TableHead>Variant</TableHead>
                        <TableHead>Barcode</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-center">Stock</TableHead>
                        <TableHead className="text-center">Active</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variants.map((v) => {
                        const isEditing = editingVariantId === v.id
                        const currentStock = v.inventory?.quantity ?? 0
                        const stockChanged = (inventoryForm[v.id] ?? currentStock) !== currentStock

                        return (
                          <TableRow key={v.id} className={cn(isEditing && "bg-muted/20")}>
                            {/* Thumbnail */}
                            <TableCell className="pr-0">
                              <button
                                type="button"
                                onClick={() => setImageEditingId(imageEditingId === v.id ? null : v.id)}
                                title="Edit variant images"
                                className="w-8 h-8 rounded border border-border bg-muted flex items-center justify-center overflow-hidden hover:border-primary transition-colors flex-shrink-0"
                              >
                                {(variantImages[v.id] ?? [])[0]
                                  ? <Image src={(variantImages[v.id] ?? [])[0]} alt="" width={32} height={32} className="object-cover w-full h-full" />
                                  : <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                }
                              </button>
                            </TableCell>

                            {/* Name */}
                            <TableCell>
                              <p className="font-medium text-sm">{v.name || v.sku}</p>
                              <p className="text-xs text-muted-foreground font-mono">{v.sku}</p>
                            </TableCell>

                            {/* Barcode */}
                            <TableCell>
                              <BarcodeCopy value={v.barcode} />
                            </TableCell>

                            {/* Cost */}
                            <TableCell className="text-right">
                              {isEditing
                                ? <Input type="number" className="w-24 h-7 text-right" value={variantEditForm?.cost_price ?? 0} onChange={(e) => setVariantEditForm({ ...variantEditForm!, cost_price: parseFloat(e.target.value) || 0 })} />
                                : <span className="text-sm text-muted-foreground">{formatCurrency(v.cost_price ?? formData.cost_price)}</span>
                              }
                            </TableCell>

                            {/* Price */}
                            <TableCell className="text-right">
                              {isEditing
                                ? <Input type="number" className="w-24 h-7 text-right" value={variantEditForm?.selling_price ?? 0} onChange={(e) => setVariantEditForm({ ...variantEditForm!, selling_price: parseFloat(e.target.value) || 0 })} />
                                : <span className="text-sm font-medium">{formatCurrency(v.selling_price ?? formData.selling_price)}</span>
                              }
                            </TableCell>

                            {/* Stock */}
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Input
                                  type="number"
                                  min="0"
                                  className="w-16 h-7 text-center"
                                  value={inventoryForm[v.id] ?? currentStock}
                                  onChange={(e) => setInventoryForm((prev) => ({ ...prev, [v.id]: parseInt(e.target.value) || 0 }))}
                                />
                                {stockChanged && (
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSaveInventory(v.id)} disabled={savingInventoryId === v.id}>
                                    {savingInventoryId === v.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 text-primary" />}
                                  </Button>
                                )}
                              </div>
                            </TableCell>

                            {/* Active */}
                            <TableCell className="text-center">
                              {isEditing
                                ? <Switch checked={variantEditForm?.is_active} onCheckedChange={(c) => setVariantEditForm({ ...variantEditForm!, is_active: c })} />
                                : <Badge variant={v.is_active ? "default" : "secondary"} className="text-xs">{v.is_active ? "Yes" : "No"}</Badge>
                              }
                            </TableCell>

                            {/* Actions */}
                            <TableCell>
                              <div className="flex items-center justify-end gap-0.5">
                                {isEditing ? (
                                  <>
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSaveVariant(v.id)} disabled={savingVariantId === v.id}>
                                      {savingVariantId === v.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingVariantId(null); setVariantEditForm(null) }}>
                                      <X className="h-3.5 w-3.5" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Edit pricing" onClick={() => startEditVariant(v)}>
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" title="Delete" onClick={() => handleDeleteVariant(v.id)}>
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Inline image editor — shows below the table when a thumbnail is clicked */}
              {imageEditingId && (() => {
                const v = variants.find((x) => x.id === imageEditingId)
                if (!v) return null
                const imgs = variantImages[v.id] ?? []
                return (
                  <div className="rounded-lg border border-primary/40 bg-primary/5 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Images for <span className="text-primary">{v.name || v.sku}</span></p>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveVariantImages(v.id)} disabled={savingImagesId === v.id}>
                          {savingImagesId === v.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save images"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setImageEditingId(null)}><X className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>

                    {imgs.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {imgs.map((src, idx) => (
                          <div key={src + idx} className="relative group w-14 h-14 rounded-md overflow-hidden border border-border">
                            <Image src={src} alt="" fill className="object-cover" />
                            {idx === 0 && <span className="absolute bottom-0 left-0 right-0 bg-accent/80 text-accent-foreground text-[8px] text-center leading-4">Primary</span>}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5">
                              {idx !== 0 && (
                                <button type="button" className="text-[9px] bg-accent/80 text-white rounded px-1" onClick={() => setVariantImages((prev) => { const n = [...(prev[v.id] ?? [])]; const [item] = n.splice(idx, 1); n.unshift(item); return { ...prev, [v.id]: n } })}>
                                  <Star className="h-2.5 w-2.5" />
                                </button>
                              )}
                              <button type="button" className="bg-destructive/80 rounded p-0.5" onClick={() => setVariantImages((prev) => ({ ...prev, [v.id]: (prev[v.id] ?? []).filter((_, i) => i !== idx) }))}>
                                <X className="h-3 w-3 text-white" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <VariantImageUploader onUploaded={(urls) => setVariantImages((prev) => ({ ...prev, [v.id]: [...(prev[v.id] ?? []), ...urls] }))} />
                  </div>
                )
              })()}
            </TabsContent>

            {/* ── Images tab ── */}
            <TabsContent value="images" className="flex-1 overflow-y-auto mt-0 px-5 py-5 space-y-4">
              {allImages.length > 0 && (
                <div className="space-y-2">
                  <Label>Product Images</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {allImages.map((src, idx) => (
                      <div key={src + idx} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                        <Image src={src} alt={`Image ${idx + 1}`} fill className="object-cover" />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 flex items-center gap-0.5 bg-accent text-accent-foreground text-[9px] font-semibold px-1.5 py-0.5 rounded-full">
                            <Star className="h-2 w-2 fill-current" />Primary
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                          {idx !== 0 && (
                            <Button type="button" size="sm" variant="secondary" className="h-6 text-[10px] px-2" onClick={() => setAllImages((prev) => { const n = [...prev]; const [item] = n.splice(idx, 1); n.unshift(item); return n })}>
                              <Star className="h-2.5 w-2.5 mr-1" />Primary
                            </Button>
                          )}
                          <Button type="button" size="icon" variant="destructive" className="h-6 w-6" onClick={() => setAllImages((prev) => prev.filter((_, i) => i !== idx))}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Hover an image to set as primary or delete. First image is used on product cards.</p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <ImagePlus className="h-4 w-4" />
                  {allImages.length === 0 ? "Add Images" : "Add More"}
                </Label>
                <Dropzone {...uploadProps}>
                  {uploadProps.files.length === 0 && <DropzoneEmptyState />}
                  <DropzoneContent />
                </Dropzone>
                <p className="text-xs text-muted-foreground">Up to 10 images, max 5 MB each.</p>
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Print labels dialog */}
      <PrintLabelsDialog open={printOpen} onOpenChange={setPrintOpen} items={labelItems} />
    </>
  )
}
