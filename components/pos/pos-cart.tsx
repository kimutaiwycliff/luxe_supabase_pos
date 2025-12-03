"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Trash2, Plus, Minus, User, X, ShoppingCart, Tag } from "lucide-react"
import { formatCurrency } from "@/lib/format"
import type { CartItem } from "./pos-layout"
import type { Customer } from "@/lib/types"
import { CustomerSearchDialog } from "./customer-search-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface POSCartProps {
  items: CartItem[]
  customer: Customer | null
  subtotal: number
  itemDiscounts: number
  orderDiscount: number
  discountType: "fixed" | "percentage"
  discountValue: number
  tax: number
  total: number
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onUpdateItemDiscount: (itemId: string, discount: number) => void
  onRemoveItem: (itemId: string) => void
  onClearCart: () => void
  onSelectCustomer: (customer: Customer | null) => void
  onCheckout: () => void
  onOrderDiscountChange: (discount: number) => void
  onDiscountTypeChange: (type: "fixed" | "percentage") => void
}

export function POSCart({
  items,
  customer,
  subtotal,
  itemDiscounts,
  orderDiscount,
  discountType,
  discountValue,
  tax,
  total,
  onUpdateQuantity,
  onUpdateItemDiscount,
  onRemoveItem,
  onClearCart,
  onSelectCustomer,
  onCheckout,
  onOrderDiscountChange,
  onDiscountTypeChange,
}: POSCartProps) {
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false)

  const handleCustomerSelect = (selectedCustomer: Customer) => {
    onSelectCustomer(selectedCustomer)
    setCustomerDialogOpen(false)
  }

  const totalDiscount = itemDiscounts + orderDiscount

  return (
    <div className="flex h-full flex-col">
      {/* Cart Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Current Sale</h2>
          {items.length > 0 && (
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onClearCart}>
              <Trash2 className="mr-1 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Customer Selection */}
        <div className="mt-3">
          {customer ? (
            <div className="flex items-center justify-between rounded-lg bg-secondary p-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {customer.first_name} {customer.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{customer.phone}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onSelectCustomer(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start bg-transparent"
              onClick={() => setCustomerDialogOpen(true)}
            >
              <User className="mr-2 h-4 w-4" />
              Add Customer (Optional)
            </Button>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <ScrollArea className="flex-1">
        {items.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">Cart is empty</p>
            <p className="text-sm text-muted-foreground">Click products to add them</p>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.product.name}</p>
                    {item.variant && item.variant.option_values && (
                      <p className="text-xs text-muted-foreground">
                        {Object.values(item.variant.option_values).join(" / ")}
                      </p>
                    )}
                    {item.variant && !item.variant.option_values && (
                      <p className="text-xs text-muted-foreground">{item.variant.sku}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.price)} each
                      <span className="ml-1 text-xs">({item.tax_rate}% VAT)</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 bg-transparent"
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(item.id, Number.parseInt(e.target.value) || 0)}
                      className="h-7 w-12 text-center"
                      min="1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 bg-transparent"
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(item.price * item.quantity - item.discount)}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Item Discount Input */}
                <div className="mt-2 flex items-center gap-2">
                  <Tag className="h-3 w-3 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Item discount"
                    value={item.discount || ""}
                    onChange={(e) => onUpdateItemDiscount(item.id, Number.parseFloat(e.target.value) || 0)}
                    className="h-7 flex-1 text-sm"
                    min="0"
                    max={item.price * item.quantity}
                  />
                  {item.discount > 0 && <span className="text-xs text-success">-{formatCurrency(item.discount)}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Cart Footer */}
      <div className="border-t border-border p-4">
        {/* Order Discount Section */}
        {items.length > 0 && (
          <div className="mb-4">
            <Label className="text-xs text-muted-foreground">Order Discount</Label>
            <div className="mt-1 flex gap-2">
              <Select value={discountType} onValueChange={(v) => onDiscountTypeChange(v as "fixed" | "percentage")}>
                <SelectTrigger className="w-24 bg-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">KES</SelectItem>
                  <SelectItem value="percentage">%</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="0"
                value={discountValue || ""}
                onChange={(e) => onOrderDiscountChange(Number.parseFloat(e.target.value) || 0)}
                className="flex-1"
                min="0"
                max={discountType === "percentage" ? 100 : subtotal}
              />
            </div>
          </div>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between text-success">
              <span>Discount</span>
              <span>-{formatCurrency(totalDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">VAT</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>
        </div>

        <Button className="mt-4 w-full" size="lg" disabled={items.length === 0} onClick={onCheckout}>
          Checkout - {formatCurrency(total)}
        </Button>
      </div>

      {/* Customer Search Dialog */}
      <CustomerSearchDialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        onSelect={handleCustomerSelect}
      />
    </div>
  )
}
