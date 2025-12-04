"use client"

import { useHits, useInstantSearch } from "react-instantsearch"
import { Award, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import type { AlgoliaCustomer } from "@/lib/algolia"

interface CustomerHitsProps {
  onSelect: (customer: AlgoliaCustomer) => void
}

export function CustomerHits({ onSelect }: CustomerHitsProps) {
  const { hits } = useHits<AlgoliaCustomer>()
  const { status } = useInstantSearch()

  const loading = status === "loading" || status === "stalled"

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (hits.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No customers found</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {hits.map((customer) => (
        <Button
          key={customer.objectID}
          variant="outline"
          className="h-auto w-full justify-start p-3 bg-transparent"
          onClick={() => onSelect(customer)}
        >
          <User className="mr-3 h-8 w-8 rounded-full bg-secondary p-1.5" />
          <div className="text-left flex-1">
            <p className="font-medium">{customer.full_name}</p>
            <p className="text-xs text-muted-foreground">{customer.phone || customer.email || "No contact"}</p>
          </div>
          {customer.loyalty_points > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Award className="h-3 w-3 text-yellow-500" />
              {customer.loyalty_points}
            </span>
          )}
        </Button>
      ))}
    </div>
  )
}
