"use client"

import { useState, useCallback, useEffect } from "react"
import { useSidebar } from "@/components/ui/sidebar"
import { POSHeader } from "./pos-header"
import { POSProductGrid } from "./pos-product-grid"
import { POSCart } from "./pos-cart"
import { POSPaymentDialog } from "./pos-payment-dialog"
import { POSReceiptDialog } from "./pos-receipt-dialog"
import { getDefaultLocation, type Location } from "@/lib/actions/locations"
import type { Product, ProductVariant, Customer, Order } from "@/lib/types"

export interface CartItem {
  id: string
  product: Product
  variant?: ProductVariant
  quantity: number
  price: number
  discount: number
}

export function POSLayout() {
  const { setOpen } = useSidebar()

  // Collapse sidebar on mount for full POS experience
  useState(() => {
    setOpen(false)
  })

  const [cart, setCart] = useState<CartItem[]>([])
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false)
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [location, setLocation] = useState<Location | null>(null)

  useEffect(() => {
    async function fetchLocation() {
      const { location } = await getDefaultLocation()
      setLocation(location)
    }
    fetchLocation()
  }, [])

  const addToCart = useCallback((product: Product, variant?: ProductVariant) => {
    setCart((prevCart) => {
      const itemId = variant ? `${product.id}-${variant.id}` : product.id
      const existingIndex = prevCart.findIndex((item) => item.id === itemId)

      if (existingIndex >= 0) {
        const updated = [...prevCart]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        }
        return updated
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
        },
      ]
    })
  }, [])

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== itemId))
    } else {
      setCart((prev) => prev.map((item) => (item.id === itemId ? { ...item, quantity } : item)))
    }
  }, [])

  const removeItem = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    setCustomer(null)
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
  const totalDiscount = cart.reduce((sum, item) => sum + item.discount, 0)
  const tax = (subtotal - totalDiscount) * 0.16
  const total = subtotal - totalDiscount + tax

  return (
    <div className="flex h-[calc(100vh-1rem)] flex-col bg-background">
      <POSHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <div className="flex flex-1 overflow-hidden">
        {/* Product Grid */}
        <div className="flex-1 overflow-auto p-4">
          <POSProductGrid searchQuery={searchQuery} onAddToCart={addToCart} />
        </div>

        {/* Cart Sidebar */}
        <div className="w-96 border-l border-border bg-card">
          <POSCart
            items={cart}
            customer={customer}
            subtotal={subtotal}
            discount={totalDiscount}
            tax={tax}
            total={total}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onClearCart={clearCart}
            onSelectCustomer={setCustomer}
            onCheckout={() => setPaymentDialogOpen(true)}
          />
        </div>
      </div>

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
