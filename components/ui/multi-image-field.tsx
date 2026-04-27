"use client"

import { useState } from "react"
import Image from "next/image"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/dropzone"
import { useSupabaseUpload } from "@/hooks/use-supabase-upload"
import { X, Plus, Link as LinkIcon, Upload } from "lucide-react"

interface MultiImageFieldProps {
  label: string
  values: string[]
  onChange: (urls: string[]) => void
  bucket?: string
  path?: string
  hint?: string
  max?: number
}

function AddImagePanel({
  bucket,
  path,
  onAdd,
  onCancel,
}: {
  bucket: string
  path: string
  onAdd: (url: string) => void
  onCancel: () => void
}) {
  const [urlInput, setUrlInput] = useState("")

  const uploadProps = useSupabaseUpload({
    bucketName: bucket,
    path,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFiles: 1,
    maxFileSize: 5 * 1024 * 1024,
    onUploadComplete: (urls) => {
      if (urls[0]) onAdd(urls[0])
    },
  })

  function handleUrlAdd() {
    const url = urlInput.trim()
    if (!url) return
    onAdd(url)
  }

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
      <Tabs defaultValue="url">
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
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); handleUrlAdd() }
              }}
            />
            <Button
              type="button" size="sm" className="h-8 px-3 text-xs"
              onClick={handleUrlAdd} disabled={!urlInput.trim()}
            >
              Add
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="mt-2">
          <Dropzone {...uploadProps} className="min-h-[100px]">
            {uploadProps.files.length === 0 && <DropzoneEmptyState />}
            <DropzoneContent />
          </Dropzone>
        </TabsContent>
      </Tabs>

      <Button
        type="button" variant="ghost" size="sm"
        className="text-xs h-7 text-muted-foreground"
        onClick={onCancel}
      >
        Cancel
      </Button>
    </div>
  )
}

export function MultiImageField({
  label,
  values,
  onChange,
  bucket = "collections",
  path = "hero",
  hint,
  max = 5,
}: MultiImageFieldProps) {
  const [adding, setAdding] = useState(false)

  function handleAdd(url: string) {
    if (!url || values.includes(url)) return
    onChange([...values, url])
    setAdding(false)
  }

  function handleRemove(index: number) {
    onChange(values.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {/* Thumbnail strip */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((url, i) => (
            <div
              key={url + i}
              className="group relative h-16 w-16 overflow-hidden rounded-lg border border-border bg-muted flex-shrink-0"
            >
              <Image src={url} alt={`${label} ${i + 1}`} fill className="object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X className="h-2.5 w-2.5" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-0.5 left-0.5 rounded text-[8px] bg-black/60 text-white px-1 leading-tight font-medium">
                  1st
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add panel */}
      {values.length < max && (
        adding ? (
          <AddImagePanel
            bucket={bucket}
            path={path}
            onAdd={handleAdd}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <Button
            type="button" variant="outline" size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setAdding(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            {values.length === 0 ? "Add hero image" : "Add another image"}
          </Button>
        )
      )}

      {values.length >= max && (
        <p className="text-xs text-muted-foreground">Maximum {max} images reached.</p>
      )}

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
