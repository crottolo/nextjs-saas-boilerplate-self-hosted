'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Building2, Check, X, Loader2, Mail } from 'lucide-react'
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
      // Wait for session check to complete
      if (sessionLoading) return

      // If not logged in, don't try to fetch (API requires auth)
      if (!session) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await authClient.organization.getInvitation({
          query: { id: invitationId },
        })
        if (error) {
          setError('Invitation not found or expired')
        } else if (data) {
          setInvitation(data as unknown as Invitation)
        }
      } catch {
        setError('Failed to load invitation')
      } finally {
        setLoading(false)
      }
    }
    fetchInvitation()
  }, [invitationId, session, sessionLoading])

  async function handleAccept() {
    if (!session) {
      // Redirect to login with callback and pre-filled email
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
      router.push('/organizations')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to accept invitation'
      )
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
        setError(magicLinkError.message || 'Failed to send magic link')
      } else {
        setMagicLinkSent(true)
      }
    } catch {
      setError('Failed to send magic link')
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
      setError(
        err instanceof Error ? err.message : 'Failed to reject invitation'
      )
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

  // Show magic link flow if not authenticated
  if (!session && !invitation) {
    // Magic link sent - show success message
    if (magicLinkSent) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Check your email</CardTitle>
              <CardDescription>
                We sent a magic link to <strong>{invitedEmail}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                Click the link in your email to sign in and accept this
                invitation.
              </p>
            </CardContent>
            <CardFooter className="justify-center">
              <Button variant="outline" onClick={() => setMagicLinkSent(false)}>
                Use a different method
              </Button>
            </CardFooter>
          </Card>
        </div>
      )
    }

    // Show magic link form
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Organization Invitation</CardTitle>
            <CardDescription>
              {invitedEmail
                ? `This invitation is for ${invitedEmail}`
                : 'You have been invited to join an organization'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            {invitedEmail ? (
              <p className="text-sm text-muted-foreground">
                Click below to receive a sign-in link at your email.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Please sign in to view and accept this invitation.
              </p>
            )}
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
                Send Magic Link to {invitedEmail}
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
              Sign in with password instead
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
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={() => router.push('/dashboard')}>
              Go to Dashboard
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
              {isExpired ? 'Invitation Expired' : 'Invitation Already Handled'}
            </CardTitle>
            <CardDescription>
              {isExpired
                ? 'This invitation has expired. Please request a new one.'
                : `This invitation has already been ${invitation.status}.`}
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={() => router.push('/dashboard')}>
              Go to Dashboard
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
          <CardTitle>You&apos;re Invited!</CardTitle>
          <CardDescription>
            <strong>{invitation.inviterEmail}</strong> has invited you to join{' '}
            <strong>{invitation.organizationName}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Organization</span>
              <span className="font-medium">{invitation.organizationName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium capitalize">
                {invitation.role || 'Member'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Invited by</span>
              <span className="font-medium">{invitation.inviterEmail}</span>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          {!session && (
            <p className="text-sm text-muted-foreground text-center">
              Please sign in to accept or decline this invitation.
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
            Decline
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
            {session ? 'Accept' : 'Sign in to Accept'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
