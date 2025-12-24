'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function TwoFactorPage() {
  const t = useTranslations('twoFactor')
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const code = formData.get('code') as string

    const { error } = await authClient.twoFactor.verifyTotp({
      code,
      trustDevice: true,
    })

    if (error) {
      setError(error.message || t('invalidCode'))
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('title')}</CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">{t('code')}</Label>
            <Input
              id="code"
              name="code"
              type="text"
              placeholder={t('codePlaceholder')}
              maxLength={6}
              pattern="[0-9]{6}"
              className="text-center text-2xl tracking-widest"
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('verifying') : t('verify')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
