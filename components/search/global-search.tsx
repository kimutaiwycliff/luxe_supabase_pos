"use client"

import { useState, useCallback } from "react"
import { useRouter } from 'next/navigation'
import { InstantSearch, useHits, useSearchBox, Configure } from "react-instantsearch"
import { searchClient, ALGOLIA_INDEXES } from "@/lib/algolia-client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CommandDialog, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Search, Package, Users, Truck } from "lucide-react"
import { formatCurrency } from "@/lib/format"
import type { AlgoliaProduct, AlgoliaCustomer, AlgoliaSupplier } from "@/lib/algolia"

function ProductResults({ onSelect }: { onSelect: (id: string) => void }) {
  const { hits } = useHits<AlgoliaProduct>()
  if (hits.length === 0) return null

  return (
    <CommandGroup heading="Products">
      {hits.slice(0, 5).map((hit) => (
        <CommandItem
          key={hit.objectID}
          value={`product-${hit.objectID}`}
          onSelect={() => onSelect(`/products?id=${hit.objectID}`)}
        >
          <Package className="mr-2 h-4 w-4" />
          <div className="flex-1">
            <p className="font-medium">{hit.name}</p>
            <p className="text-xs text-muted-foreground">{hit.sku}</p>
          </div>
          <span className="text-sm font-medium">{formatCurrency(hit.selling_price)}</span>
        </CommandItem>
      ))}
    </CommandGroup>
  )
}

function CustomerResults({ onSelect }: { onSelect: (id: string) => void }) {
  const { hits } = useHits<AlgoliaCustomer>()
  if (hits.length === 0) return null

  return (
    <CommandGroup heading="Customers">
      {hits.slice(0, 5).map((hit) => (
        <CommandItem
          key={hit.objectID}
          value={`customer-${hit.objectID}`}
          onSelect={() => onSelect(`/customers?id=${hit.objectID}`)}
        >
          <Users className="mr-2 h-4 w-4" />
          <div className="flex-1">
            <p className="font-medium">{hit.full_name}</p>
            <p className="text-xs text-muted-foreground">{hit.phone || hit.email}</p>
          </div>
        </CommandItem>
      ))}
    </CommandGroup>
  )
}

function SupplierResults({ onSelect }: { onSelect: (id: string) => void }) {
  const { hits } = useHits<AlgoliaSupplier>()
  if (hits.length === 0) return null

  return (
    <CommandGroup heading="Suppliers">
      {hits.slice(0, 5).map((hit) => (
        <CommandItem
          key={hit.objectID}
          value={`supplier-${hit.objectID}`}
          onSelect={() => onSelect(`/suppliers?id=${hit.objectID}`)}
        >
          <Truck className="mr-2 h-4 w-4" />
          <div className="flex-1">
            <p className="font-medium">{hit.name}</p>
            <p className="text-xs text-muted-foreground">{hit.contact_person}</p>
          </div>
        </CommandItem>
      ))}
    </CommandGroup>
  )
}

function SearchInput() {
  const { query, refine } = useSearchBox()

  return (
    <div className="flex items-center border-b px-3">
      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      <input
        placeholder="Search products, customers, suppliers..."
        value={query}
        onChange={(e) => refine(e.target.value)}
        className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  )
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleSelect = useCallback(
    (path: string) => {
      setOpen(false)
      router.push(path)
    },
    [router],
  )

  return (
    <>
      {/* Mobile Search Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
      >
        <Search className="h-5 w-5" />
        <span className="sr-only">Search</span>
      </Button>

      {/* Desktop Search Input */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search... (⌘K)"
          className="w-64 bg-secondary pl-9 cursor-pointer"
          onClick={() => setOpen(true)}
          readOnly
        />
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        {/* Products Search */}
        <InstantSearch searchClient={searchClient} indexName={ALGOLIA_INDEXES.products}>
          <Configure hitsPerPage={5} />
          <SearchInput />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <ProductResults onSelect={handleSelect} />
          </CommandList>
        </InstantSearch>

        {/* Customers Search */}
        <InstantSearch searchClient={searchClient} indexName={ALGOLIA_INDEXES.customers}>
          <Configure hitsPerPage={5} />
          <CommandList>
            <CustomerResults onSelect={handleSelect} />
          </CommandList>
        </InstantSearch>

        {/* Suppliers Search */}
        <InstantSearch searchClient={searchClient} indexName={ALGOLIA_INDEXES.suppliers}>
          <Configure hitsPerPage={5} />
          <CommandList>
            <SupplierResults onSelect={handleSelect} />
          </CommandList>
        </InstantSearch>
      </CommandDialog>
    </>
  )
}
