'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, Link } from '@/i18n/navigation'
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, AlertCircle, Sparkles } from 'lucide-react'
import { logActivityClient } from '@/lib/activity-client'

interface UserLimits {
  plan: {
    id: string
    name: string
    maxOrganizations: number
  }
  usage: {
    organizationsOwned: number
  }
  canCreateOrganization: boolean
}

export default function CreateOrganizationPage() {
  const t = useTranslations('organizations.createPage')
  const tOrg = useTranslations('organizations')
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingLimits, setCheckingLimits] = useState(true)
  const [limits, setLimits] = useState<UserLimits | null>(null)

  useEffect(() => {
    async function checkLimits() {
      try {
        const res = await fetch('/api/user/limits')
        if (res.ok) {
          const data = await res.json()
          setLimits(data)
        }
      } catch {
        // Ignore errors, allow creation attempt
      } finally {
        setCheckingLimits(false)
      }
    }
    checkLimits()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const slug = formData.get('slug') as string

    const { error } = await authClient.organization.create({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
    })

    if (error) {
      setError(error.message || 'Failed to create organization')
      setLoading(false)
    } else {
      logActivityClient('organization_created', name)
      router.push('/organizations')
    }
  }

  // Loading state
  if (checkingLimits) {
    return (
      <div className="max-w-md mx-auto flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Limit reached - show upgrade prompt
  if (limits && !limits.canCreateOrganization) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              {t('limitReached.title')}
            </CardTitle>
            <CardDescription>{t('limitReached.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTitle>{t('limitReached.currentUsage')}</AlertTitle>
              <AlertDescription>
                {t('limitReached.usageText', {
                  current: limits.usage.organizationsOwned,
                  max: limits.plan.maxOrganizations,
                  plan: limits.plan.name,
                })}
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button asChild>
                <Link href="/pricing">
                  <Sparkles className="mr-2 h-4 w-4" />
                  {t('limitReached.upgrade')}
                </Link>
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                {t('cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('name')}</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder={t('namePlaceholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">{t('slug')}</Label>
              <Input
                id="slug"
                name="slug"
                type="text"
                placeholder={t('slugPlaceholder')}
              />
              <p className="text-xs text-muted-foreground">
                {tOrg('slugHint')}
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? t('submitting') : t('submit')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                {t('cancel')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
