"use client"

import { usePagination } from "react-instantsearch"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function AlgoliaPagination() {
  const { pages, currentRefinement, nbPages, refine, isFirstPage, isLastPage } = usePagination()

  if (nbPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <Button
        variant="outline"
        size="icon"
        onClick={() => refine(currentRefinement - 1)}
        disabled={isFirstPage}
        className="bg-transparent"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {pages.map((page) => (
        <Button
          key={page}
          variant={page === currentRefinement ? "default" : "outline"}
          size="icon"
          onClick={() => refine(page)}
          className={page !== currentRefinement ? "bg-transparent" : ""}
        >
          {page + 1}
        </Button>
      ))}
      <Button
        variant="outline"
        size="icon"
        onClick={() => refine(currentRefinement + 1)}
        disabled={isLastPage}
        className="bg-transparent"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
