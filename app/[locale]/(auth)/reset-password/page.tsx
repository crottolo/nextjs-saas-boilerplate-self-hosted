'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

function ResetPasswordContent() {
  const t = useTranslations('resetPassword')
  const tErrors = useTranslations('errors')
  const tLogin = useTranslations('login')
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleRequestReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string

    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: '/reset-password',
    })

    if (error) {
      setError(error.message || tErrors('generic'))
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
      setError(tErrors('passwordMismatch'))
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError(tErrors('passwordTooShort'))
      setLoading(false)
      return
    }

    const { error } = await authClient.resetPassword({
      newPassword: password,
      token: token!,
    })

    if (error) {
      setError(error.message || tErrors('generic'))
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success && !token) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('success.title')}</CardTitle>
          <CardDescription>{t('success.message')}</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link href="/login">
            <Button variant="outline">{t('backToLogin')}</Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  if (success && token) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('complete.title')}</CardTitle>
          <CardDescription>{t('complete.message')}</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link href="/login">
            <Button>{tLogin('submit')}</Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  if (token) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('newPassword.title')}</CardTitle>
          <CardDescription>{t('newPassword.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t('newPassword.password')}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder={t('newPassword.placeholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {t('newPassword.confirmPassword')}
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('newPassword.submitting') : t('newPassword.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('title')}</CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRequestReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={tLogin('emailPlaceholder')}
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('submitting') : t('submit')}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:underline"
        >
          {t('backToLogin')}
        </Link>
      </CardFooter>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="p-6">Loading...</CardContent>
        </Card>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
