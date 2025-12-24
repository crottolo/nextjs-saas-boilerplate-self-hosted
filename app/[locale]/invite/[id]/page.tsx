'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Building2, Check, X, Loader2, Mail } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { authClient, useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { logActivityClient } from '@/lib/activity-client'

interface Invitation {
  id: string
  email: string
  role: string | null
  status: string
  expiresAt: Date
  organizationId: string
  organizationName: string
  organizationSlug: string
  inviterId: string
  inviterEmail: string
}

export default function InvitePage() {
  const t = useTranslations('invite')
  const tErrors = useTranslations('errors')
  const tMagic = useTranslations('magicLink')
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, isPending: sessionLoading } = useSession()
  const invitedEmail = searchParams.get('email') || ''
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [sendingMagicLink, setSendingMagicLink] = useState(false)

  const invitationId = params.id as string

  useEffect(() => {
    async function fetchInvitation() {
      if (sessionLoading) return

      if (!session) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await authClient.organization.getInvitation({
          query: { id: invitationId },
        })
        if (error) {
          setError(tErrors('generic'))
        } else if (data) {
          setInvitation(data as unknown as Invitation)
        }
      } catch {
        setError(tErrors('generic'))
      } finally {
        setLoading(false)
      }
    }
    fetchInvitation()
  }, [invitationId, session, sessionLoading, tErrors])

  async function handleAccept() {
    if (!session) {
      const params = new URLSearchParams({
        callbackUrl: `/invite/${invitationId}`,
        email: invitation?.email || '',
      })
      router.push(`/login?${params.toString()}`)
      return
    }

    setAccepting(true)
    setError(null)

    try {
      await authClient.organization.acceptInvitation({
        invitationId,
      })
      logActivityClient('organization_joined', invitation?.organizationName)
      router.push('/organizations')
    } catch (err) {
      setError(err instanceof Error ? err.message : tErrors('generic'))
      setAccepting(false)
    }
  }

  async function handleSendMagicLink() {
    if (!invitedEmail) return

    setSendingMagicLink(true)
    setError(null)

    try {
      const { error: magicLinkError } = await authClient.signIn.magicLink({
        email: invitedEmail,
        callbackURL: `/invite/${invitationId}?email=${encodeURIComponent(invitedEmail)}`,
      })

      if (magicLinkError) {
        setError(magicLinkError.message || tMagic('failed'))
      } else {
        setMagicLinkSent(true)
      }
    } catch {
      setError(tMagic('failed'))
    } finally {
      setSendingMagicLink(false)
    }
  }

  async function handleReject() {
    if (!session) {
      const params = new URLSearchParams({
        callbackUrl: `/invite/${invitationId}`,
        email: invitation?.email || '',
      })
      router.push(`/?${params.toString()}`)
      return
    }

    setRejecting(true)
    setError(null)

    try {
      await authClient.organization.rejectInvitation({
        invitationId,
      })
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : tErrors('generic'))
      setRejecting(false)
    }
  }

  if (loading || sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session && !invitation) {
    if (magicLinkSent) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>{t('checkEmail.title')}</CardTitle>
              <CardDescription>
                {t('checkEmail.message', { email: invitedEmail })}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                {t('checkEmail.hint')}
              </p>
            </CardContent>
            <CardFooter className="justify-center">
              <Button variant="outline" onClick={() => setMagicLinkSent(false)}>
                {t('useDifferentMethod')}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )
    }

    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>
              {invitedEmail
                ? t('forEmail', { email: invitedEmail })
                : t('subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <p className="text-sm text-muted-foreground">
              {invitedEmail ? t('clickToReceive') : t('pleaseSignIn')}
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            {invitedEmail && (
              <Button
                className="w-full"
                onClick={handleSendMagicLink}
                disabled={sendingMagicLink}
              >
                {sendingMagicLink ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                {t('sendMagicLink', { email: invitedEmail })}
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                const loginParams = new URLSearchParams({
                  callbackUrl: `/invite/${invitationId}${invitedEmail ? `?email=${encodeURIComponent(invitedEmail)}` : ''}`,
                  ...(invitedEmail && { email: invitedEmail }),
                })
                router.push(`/?${loginParams.toString()}`)
              }}
            >
              {t('signInWithPassword')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <X className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>{t('invalid')}</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={() => router.push('/dashboard')}>
              {t('goToDashboard')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!invitation) return null

  const isExpired = new Date(invitation.expiresAt) < new Date()
  const isAlreadyHandled = invitation.status !== 'pending'

  if (isExpired || isAlreadyHandled) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>
              {isExpired ? t('expired.title') : t('handled.title')}
            </CardTitle>
            <CardDescription>
              {isExpired
                ? t('expired.message')
                : t('handled.message', { status: invitation.status })}
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={() => router.push('/dashboard')}>
              {t('goToDashboard')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{t('youreInvited')}</CardTitle>
          <CardDescription>
            {t('invitedBy', {
              email: invitation.inviterEmail,
              organization: invitation.organizationName,
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('organization')}</span>
              <span className="font-medium">{invitation.organizationName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('role')}</span>
              <span className="font-medium capitalize">
                {invitation.role || t('member')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t('invitedByLabel')}
              </span>
              <span className="font-medium">{invitation.inviterEmail}</span>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          {!session && (
            <p className="text-sm text-muted-foreground text-center">
              {t('pleaseSignInToAccept')}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleReject}
            disabled={accepting || rejecting}
          >
            {rejecting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <X className="mr-2 h-4 w-4" />
            )}
            {t('decline')}
          </Button>
          <Button
            className="flex-1"
            onClick={handleAccept}
            disabled={accepting || rejecting}
          >
            {accepting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            {session ? t('accept') : t('signInToAccept')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
