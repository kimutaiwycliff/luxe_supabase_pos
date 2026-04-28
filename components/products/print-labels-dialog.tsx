"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarcodeLabel } from "@/components/products/barcode-label"
import { Printer, Minus, Plus } from "lucide-react"

export interface LabelItem {
  id: string
  barcode: string
  productName: string
  variantName?: string | null
  price: number
}

interface PrintLabelsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: LabelItem[]
}

export function PrintLabelsDialog({ open, onOpenChange, items }: PrintLabelsDialogProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(items.map((i) => [i.id, 1])),
  )
  const [labelSize, setLabelSize] = useState<"sm" | "md">("md")

  const updateQty = (id: string, delta: number) =>
    setQuantities((prev) => ({ ...prev, [id]: Math.max(1, (prev[id] ?? 1) + delta) }))

  const expandedLabels = items.flatMap((item) =>
    Array.from({ length: quantities[item.id] ?? 1 }, (_, i) => ({ ...item, key: `${item.id}-${i}` })),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden gap-0 p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Print Barcode Labels</DialogTitle>
        </DialogHeader>

        {/*
          Print isolation via visibility rather than display:none.
          display:none on an ancestor prevents children from overriding it;
          visibility:hidden can be overridden by descendants with visibility:visible.
          The Dialog renders inside a Radix portal (direct child of <body>), so
          display:none on body > * was hiding the portal and making the area blank.
        */}
        <style>{`
          @media print {
            @page { margin: 4mm; }
            body * { visibility: hidden !important; }
            #print-labels-area,
            #print-labels-area * { visibility: visible !important; }
            #print-labels-area {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              display: flex !important;
              flex-wrap: wrap;
              align-content: flex-start;
              gap: 1.5mm;
              padding: 0;
              background: white !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .barcode-label {
              break-inside: avoid;
              page-break-inside: avoid;
            }
          }
        `}</style>

        <div className="flex items-center gap-4 px-6 py-3 border-b bg-muted/30 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Size</Label>
            <Select value={labelSize} onValueChange={(v) => setLabelSize(v as "sm" | "md")}>
              <SelectTrigger className="w-40 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">Small (38×25 mm)</SelectItem>
                <SelectItem value="md">Medium (50×30 mm)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <span className="text-sm text-muted-foreground">{expandedLabels.length} labels</span>
          <Button size="sm" className="ml-auto" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Quantity pickers */}
          <div className="px-6 py-4 space-y-2 border-b">
            <p className="text-sm font-medium mb-3">Copies per item</p>
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.productName}</p>
                  {item.variantName && (
                    <p className="text-xs text-muted-foreground">{item.variantName}</p>
                  )}
                  <p className="text-xs font-mono text-muted-foreground">{item.barcode}</p>
                </div>
                <div className="flex items-center gap-1.5 ml-4 flex-shrink-0">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.id, -1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    value={quantities[item.id] ?? 1}
                    onChange={(e) =>
                      setQuantities((prev) => ({ ...prev, [item.id]: Math.max(1, parseInt(e.target.value) || 1) }))
                    }
                    className="w-12 h-7 text-center px-1"
                  />
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.id, 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Preview — also serves as the print target */}
          <div className="px-6 py-4">
            <p className="text-sm font-medium mb-3">Preview</p>
            <div
              id="print-labels-area"
              className="flex flex-wrap gap-2 p-4 bg-white rounded-lg border min-h-[100px]"
            >
              {expandedLabels.map((label) => (
                <BarcodeLabel
                  key={label.key}
                  barcode={label.barcode}
                  productName={label.productName}
                  variantName={label.variantName}
                  price={label.price}
                  compact={labelSize === "sm"}
                />
              ))}
              {expandedLabels.length === 0 && (
                <p className="text-sm text-muted-foreground self-center mx-auto">No labels to print</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
