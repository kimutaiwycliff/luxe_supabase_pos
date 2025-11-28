"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { createSupplier, updateSupplier } from "@/lib/actions/suppliers"
import { toast } from "sonner"

interface Supplier {
  id: string
  name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
  payment_terms: string | null
  lead_time_days: number | null
  is_active: boolean
  notes?: string | null
}

interface SupplierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier: Supplier | null
  onSuccess: () => void
}

export function SupplierDialog({ open, onOpenChange, supplier, onSuccess }: SupplierDialogProps) {
  const [loading, setLoading] = useState(false)
  const [isActive, setIsActive] = useState(supplier?.is_active ?? true)
  const isEditing = !!supplier

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      formData.set("is_active", isActive.toString())

      if (isEditing) {
        await updateSupplier(supplier.id, formData)
        toast.success( "Supplier updated" )
      } else {
        await createSupplier(formData)
        toast( "Supplier created" )
      }

      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Failed to save supplier:", error)
      toast.error( "Failed to save supplier")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input id="name" name="name" defaultValue={supplier?.name || ""} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input id="contact_person" name="contact_person" defaultValue={supplier?.contact_person || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={supplier?.email || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={supplier?.phone || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead_time_days">Lead Time (days)</Label>
              <Input
                id="lead_time_days"
                name="lead_time_days"
                type="number"
                min="0"
                defaultValue={supplier?.lead_time_days || ""}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" defaultValue={supplier?.address || ""} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="payment_terms">Payment Terms</Label>
              <Input
                id="payment_terms"
                name="payment_terms"
                placeholder="e.g., Net 30, COD"
                defaultValue={supplier?.payment_terms || ""}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={3} defaultValue={supplier?.notes || ""} />
            </div>

            {isEditing && (
              <div className="flex items-center justify-between sm:col-span-2">
                <Label htmlFor="is_active">Active</Label>
                <Switch id="is_active" checked={isActive} onCheckedChange={setIsActive} />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
