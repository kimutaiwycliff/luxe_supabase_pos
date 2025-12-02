"use client"

import { useState, useEffect } from "react"
import { Plus, Minus, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { getSuppliers } from "@/lib/actions/suppliers"
import { getProducts } from "@/lib/actions/products"
import { createPurchaseOrder } from "@/lib/actions/purchase-orders"
import { formatCurrency } from "@/lib/format"
import { toast } from "sonner"

interface Supplier {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  sku: string
  cost_price: number
  supplier_id: string | null
}

interface OrderItem {
  product_id: string
  product_name: string
  sku: string
  quantity: number
  unit_cost: number
}

interface CreatePurchaseOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreatePurchaseOrderDialog({ open, onOpenChange, onSuccess }: CreatePurchaseOrderDialogProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<string>("")
  const [items, setItems] = useState<OrderItem[]>([])
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  const loadData = async () => {
    try {
      const [suppliersData, productsResult] = await Promise.all([getSuppliers(), getProducts()])
      setSuppliers(suppliersData || [])
      setProducts(productsResult.products || [])
    } catch (error) {
      console.error("Failed to load data:", error)
    }
  }

  const supplierProducts = products.filter((p) => p.supplier_id === selectedSupplier)

  const addProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (!product || items.some((i) => i.product_id === productId)) return

    setItems([
      ...items,
      {
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        quantity: 1,
        unit_cost: product.cost_price,
      },
    ])
  }

  const updateQuantity = (productId: string, delta: number) => {
    setItems(
      items.map((item) => {
        if (item.product_id === productId) {
          const newQty = Math.max(1, item.quantity + delta)
          return { ...item, quantity: newQty }
        }
        return item
      }),
    )
  }

  const updateCost = (productId: string, cost: number) => {
    setItems(
      items.map((item) => {
        if (item.product_id === productId) {
          return { ...item, unit_cost: cost }
        }
        return item
      }),
    )
  }

  const removeItem = (productId: string) => {
    setItems(items.filter((i) => i.product_id !== productId))
  }

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0)

  const handleSubmit = async () => {
    if (!selectedSupplier || items.length === 0) {
      toast.error(
        "Please select a supplier and add items",

      )
      return
    }

    setLoading(true)
    try {
      await createPurchaseOrder(
        selectedSupplier,
        items.map((item) => ({
          product_id: item.product_id,
          quantity_ordered: item.quantity,
          unit_cost: item.unit_cost,
        })),
        notes || undefined,
      )

      toast.success("Purchase order created")
      onOpenChange(false)
      onSuccess()

      // Reset form
      setSelectedSupplier("")
      setItems([])
      setNotes("")
    } catch (error) {
      console.error("Failed to create order:", error)
      toast.error(

        "Failed to create purchase order"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Supplier *</Label>
            <Select
              value={selectedSupplier}
              onValueChange={(value) => {
                setSelectedSupplier(value)
                setItems([])
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedSupplier && (
            <div className="space-y-2">
              <Label>Add Products</Label>
              <Select onValueChange={addProduct} value="">
                <SelectTrigger>
                  <SelectValue placeholder="Select product to add" />
                </SelectTrigger>
                <SelectContent>
                  {supplierProducts
                    .filter((p) => !items.some((i) => i.product_id === p.id))
                    .map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {items.length > 0 && (
            <div className="space-y-3">
              <Label>Order Items</Label>
              {items.map((item) => (
                <Card key={item.product_id}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">{item.sku}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-transparent"
                            onClick={() => updateQuantity(item.product_id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const qty = Number.parseInt(e.target.value) || 1
                              setItems(
                                items.map((i) =>
                                  i.product_id === item.product_id ? { ...i, quantity: Math.max(1, qty) } : i,
                                ),
                              )
                            }}
                            className="w-16 h-8 text-center"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-transparent"
                            onClick={() => updateQuantity(item.product_id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="w-24">
                          <Input
                            type="number"
                            value={item.unit_cost}
                            onChange={(e) => updateCost(item.product_id, Number.parseFloat(e.target.value) || 0)}
                            className="h-8"
                          />
                        </div>
                        <span className="w-20 text-right font-medium">
                          {formatCurrency(item.quantity * item.unit_cost)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeItem(item.product_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="flex justify-end pt-2 border-t">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-semibold">{formatCurrency(totalAmount)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes for this order..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading || items.length === 0}>
              {loading ? "Creating..." : "Create Order"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
