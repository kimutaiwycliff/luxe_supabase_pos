"use client"

import type React from "react"
import { useState } from "react"
import useSWR from "swr"
import type { ColumnDef } from "@tanstack/react-table"
import { Plus, Phone, Mail, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getCustomers, createCustomer } from "@/lib/actions/customers"
import { formatCurrency } from "@/lib/format"
import type { Customer } from "@/lib/types"

export function CustomersContent() {
  const [search, ] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    data: customers = [],
    mutate,
    isLoading,
  } = useSWR(["customers", search], () => getCustomers(search), {
    revalidateOnFocus: false,
  })

  const handleCreateCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const result = await createCustomer({
      first_name: formData.get("first_name") as string,
      last_name: formData.get("last_name") as string,
      email: (formData.get("email") as string) || undefined,
      phone: formData.get("phone") as string,
    })

    if (result.success) {
      mutate()
      setDialogOpen(false)
    }
    setIsSubmitting(false)
  }

  const totalCustomers = customers.length
  const totalLoyaltyPoints = customers.reduce((sum, c) => sum + (c.loyalty_points || 0), 0)
  const totalSpent = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0)

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: "first_name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
      cell: ({ row }) => {
        const customer = row.original
        return (
          <div className="font-medium">
            {customer.first_name} {customer.last_name}
          </div>
        )
      },
    },
    {
      id: "contact",
      header: "Contact",
      cell: ({ row }) => {
        const customer = row.original
        return (
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            {customer.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {customer.phone}
              </span>
            )}
            {customer.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {customer.email}
              </span>
            )}
          </div>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: "total_orders",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Orders" className="justify-end" />,
      cell: ({ row }) => <div className="text-right">{row.original.total_orders || 0}</div>,
      meta: { className: "text-right" },
    },
    {
      accessorKey: "total_spent",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Total Spent" className="justify-end" />,
      cell: ({ row }) => <div className="text-right">{formatCurrency(row.original.total_spent || 0)}</div>,
      meta: { className: "text-right" },
    },
    {
      accessorKey: "loyalty_points",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Loyalty Points" className="justify-end" />,
      cell: ({ row }) => (
        <span className="flex items-center justify-end gap-1">
          <Award className="h-4 w-4 text-yellow-500" />
          {row.original.loyalty_points || 0}
        </span>
      ),
      meta: { className: "text-right" },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "default" : "secondary"}>
          {row.original.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loyalty Points</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLoyaltyPoints.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
          </CardContent>
        </Card>
      </div>

      {/* DataTable with Add Customer button in toolbar */}
      <Card>
        <DataTable
          columns={columns}
          data={customers}
          isLoading={isLoading}
          searchPlaceholder="Search by name or phone..."
          emptyMessage="No customers found"
          pageSize={20}
          toolbar={
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Customer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateCustomer}>
                  <DialogHeader>
                    <DialogTitle>Add New Customer</DialogTitle>
                    <DialogDescription>Create a new customer record for your store.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name *</Label>
                        <Input id="first_name" name="first_name" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input id="last_name" name="last_name" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input id="phone" name="phone" type="tel" required placeholder="+254..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create Customer"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          }
        />
      </Card>
    </div>
  )
}
