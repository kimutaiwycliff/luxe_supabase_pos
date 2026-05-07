"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { createSupplier, updateSupplier } from "@/lib/actions/suppliers"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

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
  const [isActive, setIsActive] = useState(true)
  const isEditing = !!supplier

  useEffect(() => {
    setIsActive(supplier?.is_active ?? true)
  }, [supplier])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      formData.set("is_active", isActive.toString())

      if (isEditing) {
        await updateSupplier(supplier.id, formData)
        toast.success("Supplier updated")
      } else {
        await createSupplier(formData)
        toast.success("Supplier created")
      }

      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error("Failed to save supplier")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0 gap-0">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle>{isEditing ? "Edit Supplier" : "Add Supplier"}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={supplier?.name || ""}
                required
                className="h-11 text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  name="contact_person"
                  defaultValue={supplier?.contact_person || ""}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  defaultValue={supplier?.phone || ""}
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                defaultValue={supplier?.email || ""}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                defaultValue={supplier?.address || ""}
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_terms">Payment Terms</Label>
                <Input
                  id="payment_terms"
                  name="payment_terms"
                  placeholder="e.g., Net 30, COD"
                  defaultValue={supplier?.payment_terms || ""}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lead_time_days">Lead Time (days)</Label>
                <Input
                  id="lead_time_days"
                  name="lead_time_days"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  defaultValue={supplier?.lead_time_days || ""}
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={supplier?.notes || ""}
              />
            </div>

            {isEditing && (
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">Inactive suppliers won't appear in restock lists</p>
                </div>
                <Switch id="is_active" checked={isActive} onCheckedChange={setIsActive} />
              </div>
            )}
          </div>

          {/* Sticky footer */}
          <div className="shrink-0 px-6 py-4 border-t bg-background flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : isEditing ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
