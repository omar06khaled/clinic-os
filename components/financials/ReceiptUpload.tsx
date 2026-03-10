"use client"

import { useRef, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Paperclip, X, FileText, Loader2 } from "lucide-react"

interface Props {
  receiptUrl: string | null
  receiptName: string | null
  onChange: (url: string | null, name: string | null) => void
  disabled?: boolean
}

// Extract the storage object path from a Supabase public URL.
// Public URL format: https://<project>.supabase.co/storage/v1/object/public/receipts/<path>
function extractStoragePath(publicUrl: string): string | null {
  const marker = "/public/receipts/"
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return null
  return decodeURIComponent(publicUrl.slice(idx + marker.length))
}

export function ReceiptUpload({ receiptUrl, receiptName, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const busy = uploading || removing

  async function handleFile(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      setError("الملف أكبر من 10 ميجابايت")
      return
    }
    setUploading(true)
    setError(null)
    try {
      const supabase = createClient()
      const ext = file.name.split(".").pop() ?? "bin"
      // Bug 7 fix: path is relative to the bucket root (no bucket-name prefix)
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(path, file, { upsert: false })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from("receipts").getPublicUrl(path)
      onChange(data.publicUrl, file.name)
    } catch (err) {
      // Bug 7 fix: surface the real Supabase error message for easier debugging
      const msg = err instanceof Error ? err.message : String(err)
      setError(`فشل رفع الملف: ${msg}`)
    } finally {
      setUploading(false)
    }
  }

  async function handleRemove() {
    if (busy || disabled || !receiptUrl) return
    setRemoving(true)
    setError(null)
    try {
      const supabase = createClient()
      const path = extractStoragePath(receiptUrl)
      if (path) {
        // Attempt to delete from storage; ignore errors so the DB record is
        // always cleared even if the storage object was already removed.
        await supabase.storage.from("receipts").remove([path])
      }
      onChange(null, null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(`فشل حذف الملف: ${msg}`)
    } finally {
      setRemoving(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset input so same file can be re-uploaded if removed
    e.target.value = ""
  }

  const isImage = (name: string | null, url: string | null) => {
    const src = name ?? url ?? ""
    return /\.(png|jpg|jpeg|webp|gif)$/i.test(src)
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
        className="hidden"
        onChange={handleChange}
        disabled={disabled || busy}
      />

      {receiptUrl ? (
        <div className="flex items-center gap-2">
          {isImage(receiptName, receiptUrl) ? (
            <a href={receiptUrl} target="_blank" rel="noreferrer" className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={receiptUrl}
                alt={receiptName ?? "إيصال"}
                className="h-14 w-14 rounded-lg border object-cover cursor-pointer hover:opacity-80 transition-opacity"
              />
            </a>
          ) : (
            <a
              href={receiptUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="max-w-[140px] truncate">{receiptName ?? "ملف PDF"}</span>
            </a>
          )}
          {/* Remove button — deletes from storage then clears DB record */}
          <button
            type="button"
            title="حذف الإيصال"
            onClick={handleRemove}
            className="rounded-full p-0.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
            disabled={disabled || busy}
          >
            {removing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <X className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || busy}
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Paperclip className="h-3.5 w-3.5" />
          )}
          {uploading ? "جاري الرفع..." : "إرفاق إيصال"}
        </Button>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
