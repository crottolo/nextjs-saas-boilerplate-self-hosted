'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useRouter } from '@/i18n/navigation'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function LoginForm() {
  const t = useTranslations('login')
  const tMagic = useTranslations('magicLink')
  const tErrors = useTranslations('errors')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const prefillEmail = searchParams.get('email') || ''
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  async function handleEmailLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error, data } = await authClient.signIn.email({
      email,
      password,
      callbackURL: callbackUrl,
    })

    console.log('[Login] signIn response:', {
      error: error?.message,
      hasData: !!data,
      data,
    })

    if (error) {
      console.log('[Login] Error:', error)
      setError(error.message || tErrors('loginFailed'))
      setLoading(false)
    } else if (data) {
      console.log('[Login] Success, redirecting to dashboard...')
      // Redirect manually if auto-redirect doesn't work
      router.push('/dashboard')
    }
  }

  async function handleMagicLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('magic-email') as string

    const { error } = await authClient.signIn.magicLink({
      email,
      callbackURL: '/dashboard',
    })

    if (error) {
      setError(error.message || tMagic('failed'))
    } else {
      setMagicLinkSent(true)
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('welcomeBack')}</CardTitle>
        <CardDescription>{t('signInToAccount')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="password" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="password">{t('password')}</TabsTrigger>
            <TabsTrigger value="magic">{tMagic('tab')}</TabsTrigger>
          </TabsList>

          <TabsContent value="password">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  defaultValue={prefillEmail}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t('password')}</Label>
                  <Link
                    href="/reset-password"
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    {t('forgotPassword')}
                  </Link>
                </div>
                <Input id="password" name="password" type="password" required />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('submitting') : t('submit')}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="magic">
            {magicLinkSent ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  {tMagic('success')}
                </p>
              </div>
            ) : (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="magic-email">{t('email')}</Label>
                  <Input
                    id="magic-email"
                    name="magic-email"
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    defaultValue={prefillEmail}
                    required
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? tMagic('submitting') : tMagic('submit')}
                </Button>
              </form>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          {t('noAccount')}{' '}
          <Link href="/register" className="text-primary hover:underline">
            {t('signUp')}
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="p-6">Loading...</CardContent>
        </Card>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
