"use client"

import { useCallback, useRef, useState } from "react"
import { useDropzone, type Accept, type FileRejection, type FileError } from "react-dropzone"
import { createClient } from "@/lib/supabase/client"

export type FileWithPreview = File & {
  preview?: string
  errors: FileError[]
}

export type UseSupabaseUploadOptions = {
  bucketName: string
  path?: string
  allowedMimeTypes?: string[]
  maxFiles?: number
  maxFileSize?: number
  upsert?: boolean
  onUploadComplete?: (urls: string[]) => void
}

export type UploadError = {
  name: string
  message: string
}

export type UseSupabaseUploadReturn = ReturnType<typeof useSupabaseUpload>

export const useSupabaseUpload = ({
  bucketName,
  path = "",
  allowedMimeTypes = ["image/*"],
  maxFiles = 1,
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  upsert = false,
  onUploadComplete,
}: UseSupabaseUploadOptions) => {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<UploadError[]>([])
  const [successes, setSuccesses] = useState<string[]>([])
  const [isSuccess, setIsSuccess] = useState(false)
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    // Reset states
    setErrors([])
    setSuccesses([])
    setIsSuccess(false)

    const newFiles: FileWithPreview[] = acceptedFiles.map((file) =>
      Object.assign(file, {
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
        errors: [],
      }),
    )

    const rejectedFiles: FileWithPreview[] = fileRejections.map(({ file, errors }) =>
      Object.assign(file, {
        preview: undefined,
        errors,
      }),
    )

    setFiles([...newFiles, ...rejectedFiles])
  }, [])

  const accept: Accept = allowedMimeTypes.reduce((acc, mimeType) => {
    acc[mimeType] = []
    return acc
  }, {} as Accept)

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize: maxFileSize,
    multiple: maxFiles > 1,
  })

  const onUpload = useCallback(async () => {
    const validFiles = files.filter((file) => file.errors.length === 0)
    if (validFiles.length === 0) return

    setLoading(true)
    setErrors([])
    const uploadedPaths: string[] = []

    for (const file of validFiles) {
      try {
        // Generate unique filename
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(2, 8)
        const extension = file.name.split(".").pop()
        const fileName = `${timestamp}-${randomString}.${extension}`
        const filePath = path ? `${path}/${fileName}` : fileName

        const { error } = await supabase.storage.from(bucketName).upload(filePath, file, { upsert })

        if (error) {
          setErrors((prev) => [...prev, { name: file.name, message: error.message }])
        } else {
          setSuccesses((prev) => [...prev, file.name])

          // Get public URL
          const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath)

          uploadedPaths.push(urlData.publicUrl)
        }
      } catch (err) {
        setErrors((prev) => [
          ...prev,
          { name: file.name, message: err instanceof Error ? err.message : "Upload failed" },
        ])
      }
    }

    setLoading(false)

    if (uploadedPaths.length === validFiles.length) {
      setIsSuccess(true)
      setUploadedUrls(uploadedPaths)
      onUploadComplete?.(uploadedPaths)
    }
  }, [files, bucketName, path, upsert, supabase.storage, onUploadComplete])

  const reset = useCallback(() => {
    setFiles([])
    setErrors([])
    setSuccesses([])
    setIsSuccess(false)
    setUploadedUrls([])
  }, [])

  return {
    files,
    setFiles,
    loading,
    errors,
    successes,
    isSuccess,
    uploadedUrls,
    onUpload,
    reset,
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    inputRef,
    maxFiles,
    maxFileSize,
  }
}
