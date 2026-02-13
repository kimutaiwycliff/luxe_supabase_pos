"use client"

import { useState, useCallback, useEffect } from "react"
import { POSHeader } from "./pos-header"
import { POSProductGrid } from "./pos-product-grid"
import { POSCart } from "./pos-cart"
import { POSPaymentDialog } from "./pos-payment-dialog"
import { POSReceiptDialog } from "./pos-receipt-dialog"
import { getDefaultLocation, type Location } from "@/lib/actions/locations"
import { toast } from "sonner"
import type { Product, ProductVariant, Customer, Order } from "@/lib/types"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import { formatCurrency } from "@/lib/format"

export interface CartItem {
  id: string
  product: Product
  variant?: ProductVariant
  quantity: number
  price: number
  discount: number
  tax_rate: number
  available_stock: number
}

export function POSLayout() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false)
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [location, setLocation] = useState<Location | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [orderDiscount, setOrderDiscount] = useState<number>(0)
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">("fixed")
  const [cartSheetOpen, setCartSheetOpen] = useState(false)

  useEffect(() => {
    async function fetchLocation() {
      const { location, error } = await getDefaultLocation()
      if (error) {
        setLocationError(error)
      } else if (location) {
        setLocation(location)
      } else {
        setLocationError("No location found. Please create a location first.")
      }
    }
    fetchLocation()
  }, [])

  const addToCart = useCallback(
    (product: Product, variant?: ProductVariant, availableStock?: number) => {
      const stock = availableStock ?? 999 // Default to high value if stock not provided

      setCart((prevCart) => {
        const itemId = variant ? `${product.id}-${variant.id}` : product.id
        const existingIndex = prevCart.findIndex((item) => item.id === itemId)

        if (existingIndex >= 0) {
          const existingItem = prevCart[existingIndex]
          const newQuantity = existingItem.quantity + 1

          // Check stock validation
          if (newQuantity > existingItem.available_stock) {
            toast.error(`Insufficient stock!. Only ${existingItem.available_stock} units available`)
            return prevCart
          }

          const updated = [...prevCart]
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: newQuantity,
          }
          return updated
        }

        // Check if stock is 0 when adding new item
        if (stock <= 0) {
          toast.error(`${product.name}${variant ? ` - ${variant.name || variant.sku}` : ""} is out of stock`)
          return prevCart
        }

        const price = variant?.selling_price || product.selling_price

        return [
          ...prevCart,
          {
            id: itemId,
            product,
            variant,
            quantity: 1,
            price,
            discount: 0,
            tax_rate: variant?.tax_rate ?? product.tax_rate ?? 16,
            available_stock: stock,
          },
        ]
      })
    },
    [],
  )

  const updateQuantity = useCallback(
    (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        setCart((prev) => prev.filter((item) => item.id !== itemId))
      } else {
        setCart((prev) =>
          prev.map((item) => {
            if (item.id === itemId) {
              if (quantity > item.available_stock) {
                toast.error(`Insufficient stock. Only ${item.available_stock} units available`)
                return item
              }
              return { ...item, quantity }
            }
            return item
          }),
        )
      }
    },
    [],
  )

  const updateItemDiscount = useCallback((itemId: string, discount: number) => {
    setCart((prev) => prev.map((item) => (item.id === itemId ? { ...item, discount: Math.max(0, discount) } : item)))
  }, [])

  const removeItem = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    setCustomer(null)
    setOrderDiscount(0)
    setDiscountType("fixed")
  }, [])

  const handlePaymentComplete = useCallback(
    (order: Order) => {
      setCompletedOrder(order)
      setPaymentDialogOpen(false)
      setReceiptDialogOpen(true)
      clearCart()
    },
    [clearCart],
  )

  const handleReceiptClose = useCallback(() => {
    setReceiptDialogOpen(false)
    setCompletedOrder(null)
  }, [])

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const itemDiscounts = cart.reduce((sum, item) => sum + item.discount, 0)

  // Calculate order-level discount
  const calculatedOrderDiscount =
    discountType === "percentage" ? (subtotal - itemDiscounts) * (orderDiscount / 100) : orderDiscount
  const totalDiscount = itemDiscounts + calculatedOrderDiscount

  // Calculate tax per item based on each product's tax rate
  const tax = cart.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity - item.discount
    const itemTax = itemTotal * (item.tax_rate / 100)
    return sum + itemTax
  }, 0)

  const total = subtotal - totalDiscount + tax

  return (
    <div className="flex h-[calc(100vh-1rem)] flex-col bg-background">
      {locationError && (
        <div className="bg-destructive/10 border-b border-destructive px-4 py-2 text-sm text-destructive">
          {locationError} - Run the seed scripts to create a default location.
        </div>
      )}
      <POSHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <div className="flex flex-1 overflow-hidden">
        {/* Product Grid */}
        <div className="flex-1 overflow-auto p-2 sm:p-4 pb-20 lg:pb-4">
          <POSProductGrid searchQuery={searchQuery} onAddToCart={addToCart} locationId={location?.id} />
        </div>

        {/* Desktop Cart Sidebar - Hidden on mobile/tablet */}
        <div className="hidden lg:block w-96 border-l border-border bg-card">
          <POSCart
            items={cart}
            customer={customer}
            subtotal={subtotal}
            itemDiscounts={itemDiscounts}
            orderDiscount={calculatedOrderDiscount}
            discountType={discountType}
            discountValue={orderDiscount}
            tax={tax}
            total={total}
            onUpdateQuantity={updateQuantity}
            onUpdateItemDiscount={updateItemDiscount}
            onRemoveItem={removeItem}
            onClearCart={clearCart}
            onSelectCustomer={setCustomer}
            onCheckout={() => setPaymentDialogOpen(true)}
            onOrderDiscountChange={setOrderDiscount}
            onDiscountTypeChange={setDiscountType}
          />
        </div>
      </div>

      {/* Mobile Bottom Cart Summary Bar - Visible only on mobile/tablet */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-lg">
          <Button
            variant="ghost"
            className="w-full h-16 flex items-center justify-between px-4 rounded-none hover:bg-accent"
            onClick={() => setCartSheetOpen(true)}
          >
            <div className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </div>
              <ShoppingCart className="h-5 w-5" />
              <span className="font-medium">View Cart</span>
            </div>
            <span className="text-lg font-bold">{formatCurrency(total)}</span>
          </Button>
        </div>
      )}

      {/* Mobile Cart Sheet */}
      <Sheet open={cartSheetOpen} onOpenChange={setCartSheetOpen}>
        <SheetContent side="bottom" className="h-[90vh] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Shopping Cart</SheetTitle>
          </SheetHeader>
          <POSCart
            items={cart}
            customer={customer}
            subtotal={subtotal}
            itemDiscounts={itemDiscounts}
            orderDiscount={calculatedOrderDiscount}
            discountType={discountType}
            discountValue={orderDiscount}
            tax={tax}
            total={total}
            onUpdateQuantity={updateQuantity}
            onUpdateItemDiscount={updateItemDiscount}
            onRemoveItem={removeItem}
            onClearCart={clearCart}
            onSelectCustomer={setCustomer}
            onCheckout={() => {
              setCartSheetOpen(false)
              setPaymentDialogOpen(true)
            }}
            onOrderDiscountChange={setOrderDiscount}
            onDiscountTypeChange={setDiscountType}
          />
        </SheetContent>
      </Sheet>

      {/* Payment Dialog */}
      <POSPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        cart={cart}
        customer={customer}
        subtotal={subtotal}
        discount={totalDiscount}
        tax={tax}
        total={total}
        locationId={location?.id || null}
        onComplete={handlePaymentComplete}
      />

      {/* Receipt Dialog */}
      <POSReceiptDialog open={receiptDialogOpen} onOpenChange={handleReceiptClose} order={completedOrder} />
    </div>
  )
}
