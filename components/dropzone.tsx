"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import type { UseSupabaseUploadReturn } from "@/hooks/use-supabase-upload"
import { Button } from "@/components/ui/button"
import { CheckCircle, File, Loader2, Upload, X } from "lucide-react"
import { createContext, type PropsWithChildren, useCallback, useContext } from "react"

export const formatBytes = (
  bytes: number,
  decimals = 2,
  size?: "bytes" | "KB" | "MB" | "GB" | "TB" | "PB" | "EB" | "ZB" | "YB",
) => {
  const k = 1000
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]

  if (bytes === 0 || bytes === undefined) return size !== undefined ? `0 ${size}` : "0 bytes"
  const i = size !== undefined ? sizes.indexOf(size) : Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

type DropzoneContextType = Omit<UseSupabaseUploadReturn, "getRootProps" | "getInputProps"> & {
  inputRef: React.RefObject<HTMLInputElement | null>
}

const DropzoneContext = createContext<DropzoneContextType | undefined>(undefined)

type DropzoneProps = UseSupabaseUploadReturn & {
  className?: string
}

const Dropzone = ({
  className,
  children,
  getRootProps,
  getInputProps,
  ...restProps
}: PropsWithChildren<DropzoneProps>) => {
  const isSuccess = restProps.isSuccess
  const isActive = restProps.isDragActive
  const isInvalid =
    (restProps.isDragActive && restProps.isDragReject) ||
    (restProps.errors.length > 0 && !restProps.isSuccess) ||
    restProps.files.some((file) => file.errors.length !== 0)

  return (
    <DropzoneContext.Provider value={restProps}>
      <div
        {...getRootProps()}
        className={cn(
          "border border-dashed p-4 rounded-lg text-center flex flex-col items-center justify-center space-y-4 min-h-[150px] w-full cursor-pointer transition-colors",
          "hover:border-primary/50 hover:bg-primary/5",
          isActive && "border-primary bg-primary/10",
          isSuccess && "border-green-500 bg-green-500/10",
          isInvalid && "border-destructive bg-destructive/10",
          className,
        )}
      >
        <input {...getInputProps()} />
        {children}
      </div>
    </DropzoneContext.Provider>
  )
}

const DropzoneContent = ({ className }: { className?: string }) => {
  const { files, setFiles, onUpload, loading, successes, errors, maxFileSize, maxFiles, isSuccess } =
    useDropzoneContext()

  const exceedMaxFiles = files.length > maxFiles

  const handleRemoveFile = useCallback(
    (fileName: string) => {
      setFiles(files.filter((file) => file.name !== fileName))
    },
    [files, setFiles],
  )

  const handleUpload = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      onUpload()
    },
    [onUpload],
  )

  if (isSuccess) {
    return (
      <div className={cn("space-y-2", className)}>
        <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
        <p className="text-sm font-medium">
          Successfully uploaded {files.length} file{files.length > 1 ? "s" : ""}
        </p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-3 w-full", className)} onClick={(e) => e.stopPropagation()}>
      {files.map((file, idx) => {
        const fileError = errors.find((e) => e.name === file.name)
        const isSuccessfullyUploaded = !!successes.find((e) => e === file.name)

        return (
          <div key={file.name + idx} className="flex items-center space-x-3 p-2 border rounded-md bg-background">
            {file.type.startsWith("image/") ? (
              <img
                src={URL.createObjectURL(file) || "/placeholder.svg"}
                alt={file.name}
                className="h-10 w-10 object-cover rounded-md"
              />
            ) : (
              <File className="h-10 w-10 text-muted-foreground" />
            )}

            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              {file.errors.length > 0 ? (
                <p className="text-xs text-destructive">
                  {file.errors
                    .map((e) =>
                      e.message.startsWith("File is larger than")
                        ? `File is larger than ${formatBytes(maxFileSize, 2)} (Size: ${formatBytes(file.size, 2)})`
                        : e.message,
                    )
                    .join(", ")}
                </p>
              ) : loading && !isSuccessfullyUploaded ? (
                <p className="text-xs text-muted-foreground flex items-center">
                  <Loader2 className="h-3 w-3 animate-spin mr-1" /> Uploading...
                </p>
              ) : fileError ? (
                <p className="text-xs text-destructive">Failed: {fileError.message}</p>
              ) : isSuccessfullyUploaded ? (
                <p className="text-xs text-green-500 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" /> Uploaded
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">{formatBytes(file.size, 2)}</p>
              )}
            </div>

            {!loading && !isSuccessfullyUploaded && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveFile(file.name)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      })}
      {exceedMaxFiles && (
        <p className="text-destructive text-xs">
          Maximum {maxFiles} file{maxFiles > 1 ? "s" : ""} allowed. Remove {files.length - maxFiles} file
          {files.length - maxFiles > 1 ? "s" : ""}.
        </p>
      )}
      {files.length > 0 && !exceedMaxFiles && (
        <Button
          type="button"
          onClick={handleUpload}
          className="w-full"
          size="sm"
          disabled={files.some((file) => file.errors.length !== 0) || loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" /> Upload
            </>
          )}
        </Button>
      )}
    </div>
  )
}

const DropzoneEmptyState = ({ className }: { className?: string }) => {
  const { maxFiles, maxFileSize, inputRef, isSuccess } = useDropzoneContext()

  if (isSuccess) {
    return null
  }

  return (
    <div className={cn("space-y-1", className)}>
      <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
      <p className="text-sm font-medium text-muted-foreground">
        Upload{maxFiles && maxFiles > 1 ? ` up to ${maxFiles}` : ""} image
        {!maxFiles || maxFiles > 1 ? "s" : ""}
      </p>
      <p className="text-xs text-muted-foreground">
        Drag and drop or{" "}
        <span
          onClick={(e) => {
            e.stopPropagation()
            inputRef.current?.click()
          }}
          className="underline cursor-pointer hover:text-foreground"
        >
          browse
        </span>
      </p>
      {maxFileSize !== Number.POSITIVE_INFINITY && (
        <p className="text-xs text-muted-foreground">Max size: {formatBytes(maxFileSize, 2)}</p>
      )}
    </div>
  )
}

const useDropzoneContext = () => {
  const context = useContext(DropzoneContext)

  if (!context) {
    throw new Error("useDropzoneContext must be used within a Dropzone")
  }

  return context
}

export { Dropzone, DropzoneContent, DropzoneEmptyState, useDropzoneContext }
