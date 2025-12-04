"use client"

import { useSearchBox } from "react-instantsearch"
import { Input } from "@/components/ui/input"
import { Search, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AlgoliaSearchBoxProps {
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

export function AlgoliaSearchBox({ placeholder = "Search...", className, autoFocus = false }: AlgoliaSearchBoxProps) {
  const { query, refine, isSearchStalled } = useSearchBox()

  return (
    <div className={cn("relative", className)}>
      {isSearchStalled ? (
        <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
      ) : (
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      )}
      <Input
        type="search"
        placeholder={placeholder}
        value={query}
        onChange={(e) => refine(e.target.value)}
        className="pl-9 pr-9"
        autoFocus={autoFocus}
      />
      {query && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
          onClick={() => refine("")}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
