"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Loader2 } from "lucide-react"
import { createCustomer, getCustomerById } from "@/lib/actions/customers"
import type { Customer } from "@/lib/types"
import type { AlgoliaCustomer } from "@/lib/algolia"
import { AlgoliaProvider } from "@/components/search/algolia-provider"
import { AlgoliaSearchBox } from "@/components/search/algolia-search-box"
import { CustomerHits } from "@/components/search/customer-hits"
import { ALGOLIA_INDEXES } from "@/lib/algolia-client"

interface CustomerSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (customer: Customer) => void
}

export function CustomerSearchDialog({ open, onOpenChange, onSelect }: CustomerSearchDialogProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
  })

  const handleSelectAlgoliaCustomer = async (algoliaCustomer: AlgoliaCustomer) => {
    // Fetch full customer data from Supabase
    const result = await getCustomerById(algoliaCustomer.objectID)
    if (result.customer) {
      onSelect(result.customer)
    }
  }

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
            <AlgoliaProvider indexName={ALGOLIA_INDEXES.customers} hitsPerPage={10}>
              <AlgoliaSearchBox placeholder="Search by name, phone, or email..." autoFocus />
              <CustomerHits onSelect={handleSelectAlgoliaCustomer} />
            </AlgoliaProvider>

            <Button variant="outline" className="w-full bg-transparent" onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add New Customer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
