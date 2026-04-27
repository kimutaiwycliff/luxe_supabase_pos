"use client"

import { useState } from "react"
import Image from "next/image"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/dropzone"
import { useSupabaseUpload } from "@/hooks/use-supabase-upload"
import { X, Link as LinkIcon, Upload, ImageIcon } from "lucide-react"

interface ImageFieldProps {
  label: string
  value: string
  onChange: (url: string) => void
  bucket?: string
  path?: string
  hint?: string
}

export function ImageField({
  label,
  value,
  onChange,
  bucket = "collections",
  path = "images",
  hint,
}: ImageFieldProps) {
  const [urlInput, setUrlInput] = useState("")
  const [showChange, setShowChange] = useState(false)

  const uploadProps = useSupabaseUpload({
    bucketName: bucket,
    path,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFiles: 1,
    maxFileSize: 5 * 1024 * 1024,
    onUploadComplete: (urls) => {
      if (urls[0]) {
        onChange(urls[0])
        setShowChange(false)
        setUrlInput("")
      }
    },
  })

  function handleUrlApply() {
    const url = urlInput.trim()
    if (!url) return
    onChange(url)
    setUrlInput("")
    setShowChange(false)
  }

  function handleRemove() {
    onChange("")
    uploadProps.reset()
    setShowChange(false)
    setUrlInput("")
  }

  const hasImage = !!value && !showChange

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>

      {hasImage ? (
        <div className="space-y-2">
          <div className="relative aspect-video w-full max-w-[240px] rounded-lg overflow-hidden border border-border bg-muted">
            <Image src={value} alt={label} fill className="object-cover" />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" className="text-xs h-7"
              onClick={() => { setShowChange(true); uploadProps.reset() }}>
              Change
            </Button>
            <Button type="button" variant="ghost" size="sm" className="text-xs h-7 text-destructive hover:text-destructive"
              onClick={handleRemove}>
              <X className="h-3 w-3 mr-1" /> Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {value && showChange && (
            <button
              type="button"
              onClick={() => setShowChange(false)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              ← Keep current image
            </button>
          )}

          <Tabs defaultValue="url" className="w-full">
            <TabsList className="h-8 w-full grid grid-cols-2">
              <TabsTrigger value="url" className="text-xs gap-1.5 h-7">
                <LinkIcon className="h-3 w-3" /> Paste URL
              </TabsTrigger>
              <TabsTrigger value="upload" className="text-xs gap-1.5 h-7">
                <Upload className="h-3 w-3" /> Upload file
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="mt-2">
              <div className="flex gap-2">
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/…"
                  className="text-sm h-8"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleUrlApply() } }}
                />
                <Button type="button" size="sm" className="h-8 px-3 text-xs" onClick={handleUrlApply} disabled={!urlInput.trim()}>
                  Apply
                </Button>
              </div>
              {!value && (
                <div className="mt-2 flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground">No image set — paste a URL above or switch to Upload</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="upload" className="mt-2">
              <Dropzone {...uploadProps} className="min-h-[110px]">
                {uploadProps.files.length === 0 && <DropzoneEmptyState />}
                <DropzoneContent />
              </Dropzone>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
