'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Camera, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface AvatarUploadProps {
  currentImage?: string | null
  name?: string | null
  onUploadComplete?: (url: string) => void
}

export function AvatarUpload({
  currentImage,
  name,
  onUploadComplete,
}: AvatarUploadProps) {
  const t = useTranslations('profile.avatar')
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error(t('selectImage'))
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('maxSize'))
      return
    }

    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || t('uploadFailed'))
      }

      const { url } = await res.json()
      toast.success(t('updated'))
      onUploadComplete?.(url)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('uploadFailed'))
      setPreviewUrl(null)
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar className="h-20 w-20">
          <AvatarImage src={previewUrl || currentImage || undefined} />
          <AvatarFallback className="text-lg">{initials || '?'}</AvatarFallback>
        </Avatar>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <Camera className="mr-2 h-4 w-4" />
          {uploading ? t('uploading') : t('change')}
        </Button>
        <p className="text-xs text-muted-foreground">{t('hint')}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  )
}
