"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import JsBarcode from "jsbarcode"

interface BarcodeLabelProps {
  barcode: string
  productName: string
  variantName?: string | null
  price: number
  compact?: boolean
  className?: string
}

export function BarcodeLabel({ barcode, productName, variantName, price, compact, className }: BarcodeLabelProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !barcode) return
    try {
      JsBarcode(svgRef.current, barcode, {
        format: "CODE128",
        width: compact ? 1.1 : 1.4,
        height: compact ? 22 : 28,
        displayValue: true,
        fontSize: compact ? 7 : 8,
        textMargin: 0,
        margin: 1,
        background: "#ffffff",
        lineColor: "#000000",
      })
    } catch {
      // invalid barcode — renders nothing
    }
  }, [barcode, compact])

  return (
    <div
      className={cn("barcode-label bg-white text-black flex flex-col items-center justify-between border border-gray-400", className)}
      style={{
        width: compact ? "38mm" : "50mm",
        height: compact ? "25mm" : "30mm",
        padding: compact ? "1.5mm" : "2mm",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div className="w-full text-center leading-none">
        <p className="font-bold truncate w-full" style={{ fontSize: compact ? "5.5pt" : "6.5pt" }}>
          Luxe Collections
        </p>
        <p className="truncate w-full" style={{ fontSize: compact ? "5pt" : "6pt" }}>
          {productName}{variantName ? ` · ${variantName}` : ""}
        </p>
      </div>
      <svg ref={svgRef} style={{ display: "block", maxWidth: "100%" }} />
      <p className="font-bold" style={{ fontSize: compact ? "7pt" : "8.5pt" }}>
        KES {price.toLocaleString()}
      </p>
    </div>
  )
}
