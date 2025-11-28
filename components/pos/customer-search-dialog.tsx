"use client"

import { useState } from "react"
import useSWR from "swr"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Plus, User } from "lucide-react"
import { searchCustomerByPhone, createCustomer } from "@/lib/actions/customers"
import type { Customer } from "@/lib/types"
import { Loader2 } from "lucide-react"

interface CustomerSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (customer: Customer) => void
}

export function CustomerSearchDialog({ open, onOpenChange, onSelect }: CustomerSearchDialogProps) {
  const [searchPhone, setSearchPhone] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
  })

  const { data: searchResults, isLoading } = useSWR(
    searchPhone.length >= 3 ? ["customer-search", searchPhone] : null,
    async () => {
      const result = await searchCustomerByPhone(searchPhone)
      return result
    },
  )

  const customers = searchResults?.customers || []

  const handleCreate = async () => {
    setIsCreating(true)
    const result = await createCustomer(newCustomer)
    setIsCreating(false)

    if (result.customer) {
      onSelect(result.customer)
      setShowCreateForm(false)
      setNewCustomer({ first_name: "", last_name: "", phone: "", email: "" })
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) {
      setSearchPhone("")
      setShowCreateForm(false)
      setNewCustomer({ first_name: "", last_name: "", phone: "", email: "" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{showCreateForm ? "Add New Customer" : "Find Customer"}</DialogTitle>
        </DialogHeader>

        {showCreateForm ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={newCustomer.first_name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, first_name: e.target.value })}
                  placeholder="Jane"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={newCustomer.last_name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, last_name: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                placeholder="0712345678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                placeholder="jane@example.com"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowCreateForm(false)}>
                Back to Search
              </Button>
              <Button
                className="flex-1"
                disabled={!newCustomer.first_name || !newCustomer.last_name || isCreating}
                onClick={handleCreate}
              >
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Customer
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by phone number..."
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                className="pl-9"
              />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : customers.length > 0 ? (
              <div className="space-y-2">
                {customers.map((customer) => (
                  <Button
                    key={customer.id}
                    variant="outline"
                    className="h-auto w-full justify-start p-3 bg-transparent"
                    onClick={() => onSelect(customer)}
                  >
                    <User className="mr-3 h-8 w-8 rounded-full bg-secondary p-1.5" />
                    <div className="text-left">
                      <p className="font-medium">
                        {customer.first_name} {customer.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {customer.phone || customer.email || "No contact"}
                      </p>
                    </div>
                  </Button>
                ))}
              </div>
            ) : searchPhone.length >= 3 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No customers found</p>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">Enter at least 3 characters to search</p>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => {
                setShowCreateForm(true)
                setNewCustomer({ ...newCustomer, phone: searchPhone })
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Customer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
