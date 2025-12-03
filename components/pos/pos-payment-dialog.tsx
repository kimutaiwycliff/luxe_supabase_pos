"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/format"
import { Banknote, Smartphone, CreditCard, Loader2, Check } from "lucide-react"
import { createOrder } from "@/lib/actions/orders"
import type { CartItem } from "./pos-layout"
import type { Customer, Order } from "@/lib/types"

interface POSPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cart: CartItem[]
  customer: Customer | null
  subtotal: number
  discount: number
  tax: number
  total: number
  locationId: string | null
  onComplete: (order: Order) => void
}

export function POSPaymentDialog({
  open,
  onOpenChange,
  cart,
  customer,
  subtotal,
  discount,
  tax,
  total,
  locationId,
  onComplete,
}: POSPaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mpesa" | "card">("cash")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cash payment state
  const [cashReceived, setCashReceived] = useState<number>(0)
  const change = Math.max(0, cashReceived - total)

  // M-Pesa payment state
  const [mpesaPhone, setMpesaPhone] = useState("")
  const [mpesaReceipt, setMpesaReceipt] = useState("")

  // Quick cash amounts
  const quickCashAmounts = [100, 200, 500, 1000, 2000, 5000]

  const handlePayment = async () => {
    if (!locationId) {
      setError("No location configured. Please set up a store location first.")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const orderData = {
        customer_id: customer?.id,
        location_id: locationId,
        items: cart.map((item) => ({
          product_id: item.product.id,
          variant_id: item.variant?.id,
          product_name: item.product.name,
          variant_name: item.variant?.option_values ? Object.values(item.variant.option_values).join(" / ") : undefined,
          sku: item.variant?.sku || item.product.sku,
          quantity: item.quantity,
          unit_price: item.price,
          cost_price: item.variant?.cost_price || item.product.cost_price,
          discount_amount: item.discount,
        })),
        discount_amount: discount,
        payments: [
          {
            payment_method: paymentMethod,
            amount: total,
            mpesa_phone: paymentMethod === "mpesa" ? mpesaPhone : undefined,
            mpesa_receipt: paymentMethod === "mpesa" ? mpesaReceipt : undefined,
          },
        ],
      }

      const result = await createOrder(orderData)

      if (result.error) {
        setError(result.error)
      } else if (result.order) {
        onComplete(result.order)
        // Reset state
        setCashReceived(0)
        setMpesaPhone("")
        setMpesaReceipt("")
      }
    } catch {
      setError("Failed to process payment")
    } finally {
      setIsProcessing(false)
    }
  }

  const isPaymentValid = () => {
    if (paymentMethod === "cash") {
      return cashReceived >= total
    }
    if (paymentMethod === "mpesa") {
      return mpesaPhone.length >= 10
    }
    return true // Card always valid for now
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
        </DialogHeader>

        {/* Order Summary */}
        <div className="rounded-lg bg-secondary p-4">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Items ({cart.length})</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">VAT (16%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
          </div>
          <div className="mt-3 flex justify-between border-t border-border pt-3 text-lg font-semibold">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cash" className="flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Cash
            </TabsTrigger>
            <TabsTrigger value="mpesa" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              M-Pesa
            </TabsTrigger>
            <TabsTrigger value="card" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Card
            </TabsTrigger>
          </TabsList>

          {/* Cash Payment */}
          <TabsContent value="cash" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Cash Received</Label>
              <Input
                type="number"
                value={cashReceived || ""}
                onChange={(e) => setCashReceived(Number.parseFloat(e.target.value) || 0)}
                placeholder="Enter amount"
                className="text-lg"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {quickCashAmounts.map((amount) => (
                <Button key={amount} variant="outline" size="sm" onClick={() => setCashReceived(amount)}>
                  {formatCurrency(amount)}
                </Button>
              ))}
              <Button variant="outline" size="sm" onClick={() => setCashReceived(Math.ceil(total / 100) * 100)}>
                Exact
              </Button>
            </div>

            {cashReceived >= total && (
              <div className="rounded-lg bg-success/10 p-4 text-center">
                <p className="text-sm text-muted-foreground">Change Due</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(change)}</p>
              </div>
            )}
          </TabsContent>

          {/* M-Pesa Payment */}
          <TabsContent value="mpesa" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Customer Phone Number</Label>
              <Input value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} placeholder="07XXXXXXXX" />
              <p className="text-xs text-muted-foreground">Enter the phone number to send STK push</p>
            </div>

            <div className="space-y-2">
              <Label>M-Pesa Receipt (Optional)</Label>
              <Input
                value={mpesaReceipt}
                onChange={(e) => setMpesaReceipt(e.target.value)}
                placeholder="e.g., QH78XXXXXX"
              />
              <p className="text-xs text-muted-foreground">Enter receipt code if already paid</p>
            </div>

            <Button variant="outline" className="w-full bg-transparent" disabled>
              <Smartphone className="mr-2 h-4 w-4" />
              Send STK Push (Coming Soon)
            </Button>
          </TabsContent>

          {/* Card Payment */}
          <TabsContent value="card" className="mt-4">
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">Insert or tap card on terminal</p>
              <p className="text-sm text-muted-foreground">Amount: {formatCurrency(total)}</p>
            </div>
          </TabsContent>
        </Tabs>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="flex-1" disabled={!isPaymentValid() || isProcessing} onClick={handlePayment}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Complete Payment
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
