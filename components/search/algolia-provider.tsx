"use client"

import { searchClient } from "@/lib/algolia-client"
import type { ReactNode } from "react"
import { InstantSearch, Configure } from "react-instantsearch"

interface AlgoliaProviderProps {
  indexName: string
  children: ReactNode
  filters?: string
  hitsPerPage?: number
}

export function AlgoliaProvider({ indexName, children, filters, hitsPerPage = 20 }: AlgoliaProviderProps) {
  return (
    <InstantSearch searchClient={searchClient} indexName={indexName} future={{ preserveSharedStateOnUnmount: true }}>
      <Configure filters={filters} hitsPerPage={hitsPerPage} />
      {children}
    </InstantSearch>
  )
}
