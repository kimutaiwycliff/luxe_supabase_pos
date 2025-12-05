"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Pencil, Trash2, Save, X, Package } from "lucide-react"
import { formatCurrency } from "@/lib/format"
import {
  getProductVariants,
  updateVariant,
  updateVariantInventory,
  createVariant,
  deleteVariant,
  type ProductVariant,
} from "@/lib/actions/variants"
import { getDefaultLocation } from "@/lib/actions/locations"
import { toast } from "sonner"
import type { Product } from "@/lib/types"

interface VariantEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product
  onSuccess: () => void
}

export function VariantEditorDialog({ open, onOpenChange, product, onSuccess }: VariantEditorDialogProps) {
  const [editingVariant, setEditingVariant] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{
    cost_price: number
    selling_price: number
    compare_at_price: number
    tax_rate: number | null
    is_active: boolean
  } | null>(null)
  const [inventoryForm, setInventoryForm] = useState<{ [key: string]: number }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [savingInventory, setSavingInventory] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newVariant, setNewVariant] = useState({
    name: "",
    cost_price: product.cost_price,
    selling_price: product.selling_price,
    compare_at_price: product.compare_at_price || 0,
    tax_rate: product.tax_rate || 16,
  })
  const [locationId, setLocationId] = useState<string | null>(null)

  const { data: variantsData, mutate } = useSWR(open ? ["product-variants", product.id] : null, async () =>
    getProductVariants(product.id),
  )

  const variants = variantsData?.variants || []

  useEffect(() => {
    if (open) {
      getDefaultLocation().then((result) => {
        if (result.location) {
          setLocationId(result.location.id)
        }
      })
    }
  }, [open])

  // Initialize inventory form when variants load
  useEffect(() => {
    if (variants.length > 0) {
      const initial: { [key: string]: number } = {}
      variants.forEach((v) => {
        initial[v.id] = v.inventory?.quantity || 0
      })
      setInventoryForm(initial)
    }
  }, [variants])

  const handleEditVariant = (variant: ProductVariant) => {
    setEditingVariant(variant.id)
    setEditForm({
      cost_price: variant.cost_price || 0,
      selling_price: variant.selling_price || 0,
      compare_at_price: variant.compare_at_price || 0,
      tax_rate: variant.tax_rate,
      is_active: variant.is_active,
    })
  }

  const handleSaveVariant = async (variantId: string) => {
    if (!editForm) return
    setIsLoading(true)

    const { error } = await updateVariant(variantId, editForm)

    if (!error) {
      mutate()
      setEditingVariant(null)
      setEditForm(null)
      toast.success("Variant updated", {  description: "Pricing and settings have been saved." })
    } else {
      toast.error( "Error updating variant", { description: error })
    }

    setIsLoading(false)
  }

  const handleSaveInventory = async (variantId: string) => {
    if (!locationId) {
      toast.error("No location available. Please try again.")
      return
    }

    setSavingInventory(variantId)

    const quantity = inventoryForm[variantId] ?? 0
    const { error } = await updateVariantInventory(variantId, locationId, quantity)

    if (error) {
      toast.error(error)
    } else {
      toast.success("Inventory updated", { description: `Stock quantity set to ${quantity}` })
      mutate()
    }

    setSavingInventory(null)
  }

  const handleAddVariant = async () => {
    if (!newVariant.name) return
    setIsLoading(true)

    const { error } = await createVariant(product.id, {
      ...newVariant,
      tax_rate: newVariant.tax_rate,
    })

    if (!error) {
      mutate()
      setShowAddForm(false)
      setNewVariant({
        name: "",
        cost_price: product.cost_price,
        selling_price: product.selling_price,
        compare_at_price: product.compare_at_price || 0,
        tax_rate: product.tax_rate || 16,
      })
      toast.success("Variant added", { description: "New variant has been created." })
    } else {
      toast.error("Error", { description: error })
    }

    setIsLoading(false)
  }

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm("Are you sure you want to delete this variant?")) return
    setIsLoading(true)

    const { error } = await deleteVariant(variantId)

    if (!error) {
      mutate()
      toast.success("Variant deleted")
    } else {
      toast.error("Error", { description: error })
    }

    setIsLoading(false)
  }

  const profit = (variant: ProductVariant) => {
    const cost = variant.cost_price || product.cost_price
    const price = variant.selling_price || product.selling_price
    return price - cost
  }

  const margin = (variant: ProductVariant) => {
    const price = variant.selling_price || product.selling_price
    const p = profit(variant)
    return price > 0 ? (p / price) * 100 : 0
  }

  const getEffectiveTaxRate = (variant: ProductVariant) => {
    return variant.tax_rate ?? product.tax_rate ?? 16
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Variants - {product.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="pricing" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pricing">Pricing & Tax</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>

          <TabsContent value="pricing" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">
                Edit pricing and tax rates for each variant. Leave blank to inherit from product (Tax:{" "}
                {product.tax_rate || 16}%).
              </p>
              <Button size="sm" onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Variant
              </Button>
            </div>

            {showAddForm && (
              <div className="mb-4 p-4 border rounded-lg space-y-4">
                <h4 className="font-medium">New Variant</h4>
                <div className="grid grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={newVariant.name}
                      onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                      placeholder="e.g., Small / Red"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cost Price</Label>
                    <Input
                      type="number"
                      value={newVariant.cost_price}
                      onChange={(e) =>
                        setNewVariant({ ...newVariant, cost_price: Number.parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Selling Price</Label>
                    <Input
                      type="number"
                      value={newVariant.selling_price}
                      onChange={(e) =>
                        setNewVariant({ ...newVariant, selling_price: Number.parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tax Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newVariant.tax_rate}
                      onChange={(e) =>
                        setNewVariant({ ...newVariant, tax_rate: Number.parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <Button onClick={handleAddVariant} disabled={isLoading || !newVariant.name}>
                      {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Add
                    </Button>
                    <Button variant="ghost" onClick={() => setShowAddForm(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variant</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Cost Price</TableHead>
                  <TableHead className="text-right">Selling Price</TableHead>
                  <TableHead className="text-right">Tax %</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No variants found
                    </TableCell>
                  </TableRow>
                ) : (
                  variants.map((variant) => (
                    <TableRow key={variant.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {variant.name ||
                              (variant.option_values ? Object.values(variant.option_values).join(" / ") : variant.sku)}
                          </p>
                          {variant.option_values && (
                            <p className="text-xs text-muted-foreground">
                              {Object.entries(variant.option_values)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(", ")}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{variant.sku}</TableCell>
                      <TableCell className="text-right">
                        {editingVariant === variant.id ? (
                          <Input
                            type="number"
                            className="w-24 text-right"
                            value={editForm?.cost_price || 0}
                            onChange={(e) =>
                              setEditForm({ ...editForm!, cost_price: Number.parseFloat(e.target.value) || 0 })
                            }
                          />
                        ) : (
                          formatCurrency(variant.cost_price || product.cost_price)
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingVariant === variant.id ? (
                          <Input
                            type="number"
                            className="w-24 text-right"
                            value={editForm?.selling_price || 0}
                            onChange={(e) =>
                              setEditForm({ ...editForm!, selling_price: Number.parseFloat(e.target.value) || 0 })
                            }
                          />
                        ) : (
                          formatCurrency(variant.selling_price || product.selling_price)
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingVariant === variant.id ? (
                          <Input
                            type="number"
                            step="0.01"
                            className="w-20 text-right"
                            placeholder={`${product.tax_rate || 16}`}
                            value={editForm?.tax_rate ?? ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm!,
                                tax_rate: e.target.value ? Number.parseFloat(e.target.value) : null,
                              })
                            }
                          />
                        ) : (
                          <span className={variant.tax_rate === null ? "text-muted-foreground" : ""}>
                            {getEffectiveTaxRate(variant)}%
                            {variant.tax_rate === null && <span className="text-xs ml-1">(inherited)</span>}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={margin(variant) >= 0 ? "text-success" : "text-destructive"}>
                          {margin(variant).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {editingVariant === variant.id ? (
                          <Switch
                            checked={editForm?.is_active}
                            onCheckedChange={(checked) => setEditForm({ ...editForm!, is_active: checked })}
                          />
                        ) : (
                          <Badge variant={variant.is_active ? "default" : "secondary"}>
                            {variant.is_active ? "Active" : "Inactive"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingVariant === variant.id ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleSaveVariant(variant.id)}
                              disabled={isLoading}
                            >
                              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingVariant(null)
                                setEditForm(null)
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => handleEditVariant(variant)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDeleteVariant(variant.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="inventory" className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">Adjust stock quantities for each variant.</p>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variant</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-center">Current Stock</TableHead>
                  <TableHead className="text-center">Reserved</TableHead>
                  <TableHead className="text-center">Available</TableHead>
                  <TableHead className="text-center">New Quantity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      No variants found
                    </TableCell>
                  </TableRow>
                ) : (
                  variants.map((variant) => {
                    const current = variant.inventory?.quantity || 0
                    const reserved = variant.inventory?.reserved_quantity || 0
                    const available = current - reserved

                    return (
                      <TableRow key={variant.id}>
                        <TableCell>
                          <p className="font-medium">
                            {variant.name ||
                              (variant.option_values ? Object.values(variant.option_values).join(" / ") : variant.sku)}
                          </p>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{variant.sku}</TableCell>
                        <TableCell className="text-center">{current}</TableCell>
                        <TableCell className="text-center text-muted-foreground">{reserved}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={available <= 0 ? "destructive" : available <= 5 ? "outline" : "default"}>
                            {available}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            min="0"
                            className="w-24 mx-auto text-center"
                            value={inventoryForm[variant.id] ?? current}
                            onChange={(e) =>
                              setInventoryForm({ ...inventoryForm, [variant.id]: Number.parseInt(e.target.value) || 0 })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSaveInventory(variant.id)}
                            disabled={savingInventory === variant.id || inventoryForm[variant.id] === current}
                          >
                            {savingInventory === variant.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              onSuccess()
            }}
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
