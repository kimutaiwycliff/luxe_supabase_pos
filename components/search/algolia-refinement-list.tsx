"use client"

import { useRefinementList } from "react-instantsearch"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface AlgoliaRefinementListProps {
  attribute: string
  label?: string
  className?: string
}

export function AlgoliaRefinementList({ attribute, label, className }: AlgoliaRefinementListProps) {
  const { items, refine } = useRefinementList({ attribute })

  if (items.length === 0) return null

  return (
    <div className={cn("space-y-2", className)}>
      {label && <p className="text-sm font-medium">{label}</p>}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.value} className="flex items-center gap-2">
            <Checkbox
              id={`${attribute}-${item.value}`}
              checked={item.isRefined}
              onCheckedChange={() => refine(item.value)}
            />
            <Label htmlFor={`${attribute}-${item.value}`} className="text-sm font-normal cursor-pointer">
              {item.label} ({item.count})
            </Label>
          </div>
        ))}
      </div>
    </div>
  )
}
