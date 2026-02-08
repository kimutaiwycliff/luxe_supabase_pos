"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/format"
import {
  Banknote,
  Smartphone,
  CreditCard,
  Loader2,
  Check,
  Split,
  BookMarked,
  User,
  Phone,
  Calendar,
} from "lucide-react"
import { createOrder, createLayawayOrder } from "@/lib/actions/orders"
import type { CartItem } from "./pos-layout"
import type { Customer, Order } from "@/lib/types"
import { toast } from "sonner"
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

type PaymentMode = "single" | "split" | "layaway"

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
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("single")
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mpesa" | "card">("cash")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cash payment state
  const [cashReceived, setCashReceived] = useState<number>(0)
  const change = Math.max(0, cashReceived - total)

  // M-Pesa payment state
  const [mpesaPhone, setMpesaPhone] = useState("")
  const [mpesaReceipt, setMpesaReceipt] = useState("")

  const [splitCashAmount, setSplitCashAmount] = useState<number>(0)
  const [splitMpesaAmount, setSplitMpesaAmount] = useState<number>(0)
  const [splitMpesaPhone, setSplitMpesaPhone] = useState("")
  const [splitMpesaReceipt, setSplitMpesaReceipt] = useState("")
  const [splitCashReceived, setSplitCashReceived] = useState<number>(0)
  const splitTotalPaid = splitCashAmount + splitMpesaAmount
  const splitRemaining = total - splitTotalPaid
  const splitCashChange = Math.max(0, splitCashReceived - splitCashAmount)

  const [layawayDepositPercent, setLayawayDepositPercent] = useState<number>(50)
  const [layawayCustomerName, setLayawayCustomerName] = useState("")
  const [layawayCustomerPhone, setLayawayCustomerPhone] = useState("")
  const [layawayDueDate, setLayawayDueDate] = useState("")
  const [layawayPaymentMethod, setLayawayPaymentMethod] = useState<"cash" | "mpesa">("cash")
  const [layawayCashReceived, setLayawayCashReceived] = useState<number>(0)
  const [layawayMpesaPhone, setLayawayMpesaPhone] = useState("")
  const [layawayMpesaReceipt, setLayawayMpesaReceipt] = useState("")
  const layawayDepositAmount = (total * layawayDepositPercent) / 100
  const layawayBalance = total - layawayDepositAmount
  const layawayCashChange = Math.max(0, layawayCashReceived - layawayDepositAmount)

  // Quick cash amounts
  const quickCashAmounts = [100, 200, 500, 1000, 2000, 5000]
  const depositPercentages = [25, 50, 75]

  const handlePayment = async () => {
    if (!locationId) {
      setError("No location configured. Please set up a store location first.")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const orderItems = cart.map((item) => ({
        product_id: item.product.id,
        variant_id: item.variant?.id,
        product_name: item.product.name,
        variant_name: item.variant?.option_values ? Object.values(item.variant.option_values).join(" / ") : undefined,
        sku: item.variant?.sku || item.product.sku,
        quantity: item.quantity,
        unit_price: item.price,
        cost_price: item.variant?.cost_price || item.product.cost_price,
        discount_amount: item.discount,
        tax_rate: item.product.tax_rate ?? 0.16,
      }))

      if (paymentMode === "layaway") {
        if (!layawayCustomerName || !layawayCustomerPhone) {
          setError("Customer name and phone are required for layaway orders")
          setIsProcessing(false)
          return
        }

        const result = await createLayawayOrder({
          customer_id: customer?.id,
          location_id: locationId,
          items: orderItems,
          discount_amount: discount,
          deposit_percent: layawayDepositPercent,
          deposit_amount: layawayDepositAmount,
          customer_name: layawayCustomerName,
          customer_phone: layawayCustomerPhone,
          due_date: layawayDueDate || undefined,
          payment: {
            payment_method: layawayPaymentMethod,
            amount: layawayPaymentMethod === "cash" ? layawayCashReceived : layawayDepositAmount,
            mpesa_phone_number: layawayPaymentMethod === "mpesa" ? layawayMpesaPhone : undefined,
            mpesa_receipt_number: layawayPaymentMethod === "mpesa" ? layawayMpesaReceipt : undefined,
          },
        })

        if (result.error) {
          setError(result.error)
        } else if (result.order) {
          toast.info("Layaway Created", {
            description: `Order ${result.order.order_number} reserved. Balance: ${formatCurrency(layawayBalance)}`,
          })
          onComplete(result.order)
          resetState()
        }
        setIsProcessing(false)
        return
      }

      let payments: any[] = []
      if (paymentMode === "split") {
        if (splitCashAmount > 0) {
          payments.push({
            payment_method: "cash" as const,
            amount: splitCashReceived,
          })
        }
        if (splitMpesaAmount > 0) {
          payments.push({
            payment_method: "mpesa" as const,
            amount: splitMpesaAmount,
            mpesa_phone_number: splitMpesaPhone,
            mpesa_receipt_number: splitMpesaReceipt,
          })
        }
      } else {
        // Single payment
        payments = [
          {
            payment_method: paymentMethod,
            amount: paymentMethod === "cash" ? cashReceived : total,
            mpesa_phone_number: paymentMethod === "mpesa" ? mpesaPhone : undefined,
            mpesa_receipt_number: paymentMethod === "mpesa" ? mpesaReceipt : undefined,
          },
        ]
      }

      const orderData = {
        customer_id: customer?.id,
        location_id: locationId,
        items: orderItems,
        discount_amount: discount,
        payments,
      }

      const result = await createOrder(orderData)

      if (result.error) {
        setError(result.error)
      } else if (result.order) {
        onComplete(result.order)
        resetState()
      }
    } catch {
      setError("Failed to process payment")
    } finally {
      setIsProcessing(false)
    }
  }

  const resetState = () => {
    setCashReceived(0)
    setMpesaPhone("")
    setMpesaReceipt("")
    setSplitCashAmount(0)
    setSplitMpesaAmount(0)
    setSplitMpesaPhone("")
    setSplitMpesaReceipt("")
    setSplitCashReceived(0)
    setLayawayCustomerName("")
    setLayawayCustomerPhone("")
    setLayawayDueDate("")
    setLayawayCashReceived(0)
    setLayawayMpesaPhone("")
    setLayawayMpesaReceipt("")
    setPaymentMode("single")
  }

  const isPaymentValid = () => {
    if (paymentMode === "layaway") {
      const depositValid =
        layawayPaymentMethod === "cash" ? layawayCashReceived >= layawayDepositAmount : layawayMpesaPhone.length >= 10
      return depositValid && layawayCustomerName.length > 0 && layawayCustomerPhone.length >= 10
    }

    if (paymentMode === "split") {
      const totalPaid = splitCashAmount + splitMpesaAmount
      if (totalPaid < total) return false
      if (splitCashAmount > 0 && splitCashReceived < splitCashAmount) return false
      if (splitMpesaAmount > 0 && splitMpesaPhone.length < 10) return false
      return true
    }

    if (paymentMethod === "cash") {
      return cashReceived >= total
    }
    if (paymentMethod === "mpesa") {
      return mpesaPhone.length >= 10
    }
    return true
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
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
              <span className="text-muted-foreground">VAT</span>
              <span>{formatCurrency(tax)}</span>
            </div>
          </div>
          <div className="mt-3 flex justify-between border-t border-border pt-3 text-lg font-semibold">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={paymentMode === "single" ? "default" : "outline"}
            className={paymentMode === "single" ? "" : "bg-transparent"}
            onClick={() => setPaymentMode("single")}
            size="sm"
          >
            <Banknote className="mr-2 h-4 w-4" />
            Single
          </Button>
          <Button
            variant={paymentMode === "split" ? "default" : "outline"}
            className={paymentMode === "split" ? "" : "bg-transparent"}
            onClick={() => setPaymentMode("split")}
            size="sm"
          >
            <Split className="mr-2 h-4 w-4" />
            Split
          </Button>
          <Button
            variant={paymentMode === "layaway" ? "default" : "outline"}
            className={paymentMode === "layaway" ? "" : "bg-transparent"}
            onClick={() => setPaymentMode("layaway")}
            size="sm"
          >
            <BookMarked className="mr-2 h-4 w-4" />
            Layaway
          </Button>
        </div>

        {/* Single Payment Mode */}
        {paymentMode === "single" && (
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

            <TabsContent value="mpesa" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Customer Phone Number</Label>
                <Input value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} placeholder="07XXXXXXXX" />
              </div>
              <div className="space-y-2">
                <Label>M-Pesa Receipt (Optional)</Label>
                <Input
                  value={mpesaReceipt}
                  onChange={(e) => setMpesaReceipt(e.target.value)}
                  placeholder="e.g., QH78XXXXXX"
                />
              </div>
            </TabsContent>

            <TabsContent value="card" className="mt-4">
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Insert or tap card on terminal</p>
                <p className="text-sm text-muted-foreground">Amount: {formatCurrency(total)}</p>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {paymentMode === "split" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Cash portion */}
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  <Label className="font-medium">Cash Amount</Label>
                </div>
                <Input
                  type="number"
                  value={splitCashAmount || ""}
                  onChange={(e) => setSplitCashAmount(Number.parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
                {splitCashAmount > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs">Cash Received</Label>
                    <Input
                      type="number"
                      value={splitCashReceived || ""}
                      onChange={(e) => setSplitCashReceived(Number.parseFloat(e.target.value) || 0)}
                      placeholder="Enter received"
                    />
                    {splitCashReceived >= splitCashAmount && splitCashChange > 0 && (
                      <p className="text-xs text-success">Change: {formatCurrency(splitCashChange)}</p>
                    )}
                  </div>
                )}
              </div>

              {/* M-Pesa portion */}
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <Label className="font-medium">M-Pesa Amount</Label>
                </div>
                <Input
                  type="number"
                  value={splitMpesaAmount || ""}
                  onChange={(e) => setSplitMpesaAmount(Number.parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
                {splitMpesaAmount > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs">Phone Number</Label>
                    <Input
                      value={splitMpesaPhone}
                      onChange={(e) => setSplitMpesaPhone(e.target.value)}
                      placeholder="07XXXXXXXX"
                    />
                    <Label className="text-xs">Receipt (Optional)</Label>
                    <Input
                      value={splitMpesaReceipt}
                      onChange={(e) => setSplitMpesaReceipt(e.target.value)}
                      placeholder="QH78XXXXXX"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Split summary */}
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="flex justify-between">
                <span>Cash:</span>
                <span>{formatCurrency(splitCashAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>M-Pesa:</span>
                <span>{formatCurrency(splitMpesaAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2 font-medium">
                <span>Total Paid:</span>
                <span className={splitTotalPaid >= total ? "text-success" : "text-destructive"}>
                  {formatCurrency(splitTotalPaid)}
                </span>
              </div>
              {splitRemaining > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Remaining:</span>
                  <span>{formatCurrency(splitRemaining)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {paymentMode === "layaway" && (
          <div className="space-y-4">
            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer Name *
                </Label>
                <Input
                  value={layawayCustomerName}
                  onChange={(e) => setLayawayCustomerName(e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number *
                </Label>
                <Input
                  value={layawayCustomerPhone}
                  onChange={(e) => setLayawayCustomerPhone(e.target.value)}
                  placeholder="07XXXXXXXX"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Due Date (Optional)
              </Label>
              <Input
                type="date"
                value={layawayDueDate}
                onChange={(e) => setLayawayDueDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Deposit percentage */}
            <div className="space-y-2">
              <Label>Deposit Percentage</Label>
              <div className="flex gap-2">
                {depositPercentages.map((pct) => (
                  <Button
                    key={pct}
                    variant={layawayDepositPercent === pct ? "default" : "outline"}
                    className={layawayDepositPercent === pct ? "" : "bg-transparent"}
                    size="sm"
                    onClick={() => setLayawayDepositPercent(pct)}
                  >
                    {pct}%
                  </Button>
                ))}
                <Input
                  type="number"
                  value={layawayDepositPercent}
                  onChange={(e) => setLayawayDepositPercent(Math.min(100, Math.max(1, Number(e.target.value) || 0)))}
                  className="w-20"
                  min={1}
                  max={100}
                />
              </div>
            </div>

            {/* Deposit summary */}
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="flex justify-between">
                <span>Deposit ({layawayDepositPercent}%):</span>
                <span className="font-medium">{formatCurrency(layawayDepositAmount)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Balance to pay later:</span>
                <span>{formatCurrency(layawayBalance)}</span>
              </div>
            </div>

            {/* Deposit payment method */}
            <div className="space-y-3">
              <Label>Pay Deposit With</Label>
              <div className="flex gap-2">
                <Button
                  variant={layawayPaymentMethod === "cash" ? "default" : "outline"}
                  className={layawayPaymentMethod === "cash" ? "" : "bg-transparent"}
                  size="sm"
                  onClick={() => setLayawayPaymentMethod("cash")}
                >
                  <Banknote className="mr-2 h-4 w-4" />
                  Cash
                </Button>
                <Button
                  variant={layawayPaymentMethod === "mpesa" ? "default" : "outline"}
                  className={layawayPaymentMethod === "mpesa" ? "" : "bg-transparent"}
                  size="sm"
                  onClick={() => setLayawayPaymentMethod("mpesa")}
                >
                  <Smartphone className="mr-2 h-4 w-4" />
                  M-Pesa
                </Button>
              </div>

              {layawayPaymentMethod === "cash" && (
                <div className="space-y-2">
                  <Label>Cash Received</Label>
                  <Input
                    type="number"
                    value={layawayCashReceived || ""}
                    onChange={(e) => setLayawayCashReceived(Number.parseFloat(e.target.value) || 0)}
                    placeholder="Enter amount"
                  />
                  {layawayCashReceived >= layawayDepositAmount && layawayCashChange > 0 && (
                    <p className="text-sm text-success">Change: {formatCurrency(layawayCashChange)}</p>
                  )}
                </div>
              )}

              {layawayPaymentMethod === "mpesa" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      value={layawayMpesaPhone}
                      onChange={(e) => setLayawayMpesaPhone(e.target.value)}
                      placeholder="07XXXXXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Receipt (Optional)</Label>
                    <Input
                      value={layawayMpesaReceipt}
                      onChange={(e) => setLayawayMpesaReceipt(e.target.value)}
                      placeholder="QH78XXXXXX"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
                {paymentMode === "layaway" ? `Reserve (${formatCurrency(layawayDepositAmount)})` : "Complete Payment"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
