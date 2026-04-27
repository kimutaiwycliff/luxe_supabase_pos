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
        width: compact ? 1.2 : 1.5,
        height: compact ? 28 : 38,
        displayValue: true,
        fontSize: compact ? 7 : 9,
        textMargin: 1,
        margin: 2,
        background: "#ffffff",
        lineColor: "#000000",
      })
    } catch {
      // invalid barcode value — renders nothing
    }
  }, [barcode, compact])

  return (
    <div
      className={cn(
        "barcode-label bg-white text-black flex flex-col items-center justify-between border border-gray-400",
        compact ? "p-1 w-[132px] h-[82px]" : "p-1.5 w-[176px] h-[108px]",
        className,
      )}
      style={{ fontFamily: "Arial, sans-serif" }}
    >
      <div className="w-full text-center leading-tight">
        <p
          className="font-bold truncate w-full"
          style={{ fontSize: compact ? 7 : 8.5 }}
        >
          Luxe Collections
        </p>
        <p className="truncate w-full" style={{ fontSize: compact ? 6.5 : 8 }}>
          {productName}
          {variantName ? ` · ${variantName}` : ""}
        </p>
      </div>
      <svg ref={svgRef} style={{ display: "block", maxWidth: "100%" }} />
      <p className="font-bold" style={{ fontSize: compact ? 8 : 10 }}>
        KES {price.toLocaleString()}
      </p>
    </div>
  )
}
