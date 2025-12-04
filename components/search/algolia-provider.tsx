"use client"

import type { ReactNode } from "react"
import { InstantSearch, Configure } from "react-instantsearch"
import { searchClient } from "@/lib/algolia-client"

interface AlgoliaProviderProps {
  indexName: string
  children: ReactNode
  filters?: string
  hitsPerPage?: number
}

export function AlgoliaProvider({ indexName, children, filters, hitsPerPage = 20 }: AlgoliaProviderProps) {
  return (
    <InstantSearch searchClient={searchClient} indexName={indexName} future={{ preserveSharedStateOnUnmount: true }}>
      <Configure key={`${filters}-${hitsPerPage}`} filters={filters || ""} hitsPerPage={hitsPerPage} />
      {children}
    </InstantSearch>
  )
}
