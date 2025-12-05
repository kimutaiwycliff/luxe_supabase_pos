"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { StatCard } from "@/components/ui/stat-card"
import { formatCurrency, formatDate } from "@/lib/format"
import {
  BookMarked,
  Phone,
  Calendar,
  AlertTriangle,
  Search,
  DollarSign,
  Clock,
  CheckCircle,
  Banknote,
  Smartphone,
  Loader2,
} from "lucide-react"
import { getLayawayOrders, completeLayawayOrder } from "@/lib/actions/orders"
import { getLayawayStats } from "@/lib/actions/dashboard"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import type { Order } from "@/lib/types"

export function LayawaysContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mpesa">("cash")
  const [cashReceived, setCashReceived] = useState<number>(0)
  const [mpesaPhone, setMpesaPhone] = useState("")
  const [mpesaReceipt, setMpesaReceipt] = useState("")

  const { data: statsData, isLoading: statsLoading } = useSWR("layaway-stats-page", getLayawayStats)

  const {
    data: ordersData,
    isLoading: ordersLoading,
    mutate: mutateOrders,
  } = useSWR("layaway-orders", () => getLayawayOrders())

  const stats = statsData?.data
  const orders = ordersData?.orders || []

  const today = new Date().toISOString().split("T")[0]

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      order.layaway_customer_name?.toLowerCase().includes(query) ||
      order.layaway_customer_phone?.includes(query) ||
      order.order_number?.toLowerCase().includes(query)
    )
  })

  const overdueOrders = filteredOrders.filter((o) => o.layaway_due_date && o.layaway_due_date < today)
  const upcomingOrders = filteredOrders.filter((o) => !o.layaway_due_date || o.layaway_due_date >= today)

  const handleCompleteLayaway = async () => {
    if (!selectedOrder) return

    const balance = selectedOrder.total_amount - selectedOrder.paid_amount

    if (paymentMethod === "cash" && cashReceived < balance) {
      toast.error(`Insufficient payment. Need at least ${formatCurrency(balance)}`)
      return
    }

    setIsProcessing(true)

    const result = await completeLayawayOrder(selectedOrder.id, {
      payment_method: paymentMethod,
      amount: paymentMethod === "cash" ? cashReceived : balance,
      mpesa_phone_number: paymentMethod === "mpesa" ? mpesaPhone : undefined,
      mpesa_receipt_number: paymentMethod === "mpesa" ? mpesaReceipt : undefined,
    })

    setIsProcessing(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Layaway ${selectedOrder.order_number} completed!`)
      setCompleteDialogOpen(false)
      setSelectedOrder(null)
      setCashReceived(0)
      setMpesaPhone("")
      setMpesaReceipt("")
      mutateOrders()
    }
  }

  const openCompleteDialog = (order: Order) => {
    setSelectedOrder(order)
    setCashReceived(order.total_amount - order.paid_amount)
    setCompleteDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : (
          <>
            <StatCard
              title="Active Layaways"
              value={stats?.totalLayaways || 0}
              icon={BookMarked}
              className="text-primary"
            />
            <StatCard
              title="Total Reserved"
              value={formatCurrency(stats?.totalReservedValue || 0)}
              icon={DollarSign}
              className="text-blue-500"
            />
            <StatCard
              title="Deposits Collected"
              value={formatCurrency(stats?.totalCollected || 0)}
              icon={CheckCircle}
              className="text-success"
            />
            <StatCard
              title="Overdue"
              value={stats?.overdueCount || 0}
              icon={AlertTriangle}
              className={stats?.overdueCount ? "text-destructive" : "text-muted-foreground"}
            />
          </>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or order number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Orders List */}
      {ordersLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookMarked className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No layaway orders found</p>
            <p className="text-muted-foreground text-sm">
              {searchQuery ? "Try a different search term" : "Layaway orders will appear here"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Overdue Orders */}
          {overdueOrders.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-destructive mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Overdue ({overdueOrders.length})
              </h3>
              <div className="space-y-3">
                {overdueOrders.map((order) => (
                  <LayawayCard key={order.id} order={order} isOverdue onComplete={() => openCompleteDialog(order)} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Orders */}
          {upcomingOrders.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Active ({upcomingOrders.length})
              </h3>
              <div className="space-y-3">
                {upcomingOrders.map((order) => (
                  <LayawayCard key={order.id} order={order} onComplete={() => openCompleteDialog(order)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Complete Payment Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Layaway Payment</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Summary */}
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium">{selectedOrder.layaway_customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span>{formatCurrency(selectedOrder.total_amount)}</span>
                </div>
                <div className="flex justify-between text-success">
                  <span>Deposit Paid</span>
                  <span>-{formatCurrency(selectedOrder.paid_amount)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-lg font-semibold">
                  <span>Balance Due</span>
                  <span className="text-primary">
                    {formatCurrency(selectedOrder.total_amount - selectedOrder.paid_amount)}
                  </span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-3">
                <Label>Payment Method</Label>
                <div className="flex gap-2">
                  <Button
                    variant={paymentMethod === "cash" ? "default" : "outline"}
                    className={paymentMethod !== "cash" ? "bg-transparent" : ""}
                    onClick={() => setPaymentMethod("cash")}
                  >
                    <Banknote className="mr-2 h-4 w-4" />
                    Cash
                  </Button>
                  <Button
                    variant={paymentMethod === "mpesa" ? "default" : "outline"}
                    className={paymentMethod !== "mpesa" ? "bg-transparent" : ""}
                    onClick={() => setPaymentMethod("mpesa")}
                  >
                    <Smartphone className="mr-2 h-4 w-4" />
                    M-Pesa
                  </Button>
                </div>

                {paymentMethod === "cash" && (
                  <div className="space-y-2">
                    <Label>Cash Received</Label>
                    <Input
                      type="number"
                      value={cashReceived || ""}
                      onChange={(e) => setCashReceived(Number(e.target.value) || 0)}
                    />
                    {cashReceived > selectedOrder.total_amount - selectedOrder.paid_amount && (
                      <p className="text-sm text-success">
                        Change:{" "}
                        {formatCurrency(cashReceived - (selectedOrder.total_amount - selectedOrder.paid_amount))}
                      </p>
                    )}
                  </div>
                )}

                {paymentMethod === "mpesa" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        placeholder="07XXXXXXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Receipt (Optional)</Label>
                      <Input
                        value={mpesaReceipt}
                        onChange={(e) => setMpesaReceipt(e.target.value)}
                        placeholder="QH78XXXXXX"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setCompleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleCompleteLayaway} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Complete Sale
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function LayawayCard({
  order,
  isOverdue,
  onComplete,
}: {
  order: Order
  isOverdue?: boolean
  onComplete: () => void
}) {
  const balance = order.total_amount - order.paid_amount
  const depositPercent = order.layaway_deposit_percent || Math.round((order.paid_amount / order.total_amount) * 100)

  return (
    <Card className={isOverdue ? "border-destructive/50" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{order.layaway_customer_name}</span>
              <Badge variant="outline">{order.order_number}</Badge>
              {isOverdue && (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Overdue
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {order.layaway_customer_phone}
              </span>
              {order.layaway_due_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Due: {formatDate(order.layaway_due_date)}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {order.items?.length || 0} item(s) • Deposit: {depositPercent}% paid
            </p>
          </div>

          <div className="text-right space-y-2">
            <div>
              <p className="text-lg font-bold">{formatCurrency(balance)}</p>
              <p className="text-xs text-muted-foreground">balance of {formatCurrency(order.total_amount)}</p>
            </div>
            <Button size="sm" onClick={onComplete}>
              <CheckCircle className="mr-1 h-3 w-3" />
              Complete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
