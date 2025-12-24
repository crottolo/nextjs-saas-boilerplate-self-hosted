'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Check, Crown, Loader2, AlertCircle } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Plan {
  id: string
  name: string
  description: string | null
  price: number
  currency: string
  interval: string | null
  priceId: string
  features: string[]
  limits: { projects?: number; storage?: number }
  trialDays: number
  popular: boolean
}

export default function PricingPage() {
  const t = useTranslations('pricing')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [loading, setLoading] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [subscription, setSubscription] = useState<{
    status?: string
    cancelAtPeriodEnd?: boolean
    periodEnd?: string
  } | null>(null)

  // Check if user is admin
  useEffect(() => {
    async function checkAdmin() {
      try {
        const { data } = await authClient.getSession()
        if (data?.user?.role === 'admin') {
          setIsAdmin(true)
        }
      } catch {
        // Not admin
      }
    }
    checkAdmin()
  }, [])

  // Fetch plans from API
  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch('/api/plans')
        const data = await res.json()
        setPlans(data.plans || [])
      } catch {
        setPlans([])
      } finally {
        setLoadingPlans(false)
      }
    }
    fetchPlans()
  }, [])

  // Show success toast if upgraded/updated (from URL param)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('upgraded') === 'true') {
      toast.success(t('toast.activated'), { duration: 6000 })
      window.history.replaceState({}, '', `/${locale}/pricing`)
    }
    if (params.get('updated') === 'true') {
      toast.success(t('toast.updated'), { duration: 6000 })
      window.history.replaceState({}, '', `/${locale}/pricing`)
    }
    if (params.get('session_id')) {
      toast.success(t('toast.paymentSuccess'), {
        duration: 6000,
      })
      window.history.replaceState({}, '', `/${locale}/pricing`)
    }
  }, [t, locale])

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const res = await fetch('/api/subscription')
        const data = await res.json()
        if (data.subscriptions && data.subscriptions.length > 0) {
          const activeSub = data.subscriptions.find(
            (s: { status: string }) =>
              s.status === 'active' || s.status === 'trialing'
          )
          if (activeSub) {
            setCurrentPlan(activeSub.plan)
            setSubscription({
              status: activeSub.status,
              cancelAtPeriodEnd: activeSub.cancelAtPeriodEnd ?? undefined,
              periodEnd: activeSub.periodEnd
                ? new Date(activeSub.periodEnd).toLocaleDateString()
                : undefined,
            })
          }
        }
      } catch {
        // No subscription found
      }
    }
    fetchSubscription()
  }, [])

  async function handleUpgrade(planName: string, priceId: string) {
    setLoading(planName)
    try {
      const baseUrl = window.location.origin
      const successUrl = `${baseUrl}/pricing?upgraded=true`
      const cancelUrl = `${baseUrl}/pricing`

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, successUrl, cancelUrl }),
      })

      const data = await res.json()

      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || 'Failed to start checkout')
      }
    } catch {
      toast.error('Failed to start upgrade')
    } finally {
      setLoading(null)
    }
  }

  async function handleManageBilling() {
    setLoading('billing')
    try {
      const res = await fetch('/api/subscription/billing-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/pricing`,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.redirect) {
          // Customer not found, refresh page to show subscribe options
          window.location.reload()
        } else {
          toast.error(data.error || 'Failed to open billing portal')
        }
      } else if (data.url) {
        window.location.href = data.url
      }
    } catch {
      toast.error('Failed to open billing portal')
    } finally {
      setLoading(null)
    }
  }

  function formatPrice(cents: number, currency: string) {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(cents / 100)
  }

  const activePlan = currentPlan || 'free'

  if (loadingPlans) {
    return (
      <div className="container max-w-5xl py-8 mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (plans.length === 0) {
    return (
      <div className="container max-w-5xl py-8 mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Alert className="max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('noPlans.title')}</AlertTitle>
          <AlertDescription>
            {t('noPlans.description')}
            {isAdmin && (
              <Link
                href="/admin/stripe/products"
                className="block mt-2 underline hover:no-underline"
              >
                {t('noPlans.configure')}
              </Link>
            )}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container max-w-5xl py-8 mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {subscription && (
        <Card className="mb-8 bg-primary/5 border-primary/20">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">
                  {t('currentPlan', { name: currentPlan || '' })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {subscription.status === 'trialing' && `${t('trial')} · `}
                  {subscription.status === 'active' && `${t('active')} · `}
                  {subscription.cancelAtPeriodEnd && `${t('cancelsOn')} `}
                  {!subscription.cancelAtPeriodEnd && `${t('renewsOn')} `}
                  {subscription.periodEnd}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleManageBilling}
              disabled={loading === 'billing'}
            >
              {loading === 'billing'
                ? tCommon('loading')
                : t('manageSubscription')}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan =
            activePlan.toLowerCase() === plan.name.toLowerCase()

          return (
            <Card
              key={plan.id}
              className={cn(
                'relative transition-all',
                isCurrentPlan &&
                  'border-5 border-primary ring-2 ring-primary/20 shadow-lg',
                plan.popular && !isCurrentPlan && 'border-primary/50 shadow-md'
              )}
            >
              {isCurrentPlan && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  {t('currentPlanBadge')}
                </Badge>
              )}
              {plan.popular && !isCurrentPlan && (
                <Badge
                  variant="secondary"
                  className="absolute -top-3 left-1/2 -translate-x-1/2"
                >
                  {t('mostPopular')}
                </Badge>
              )}

              <CardHeader className={cn(isCurrentPlan)}>
                <CardTitle className="flex items-center gap-2">
                  {plan.name}
                  {isCurrentPlan && <Check className="h-5 w-5 text-primary" />}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    {formatPrice(plan.price, plan.currency)}
                  </span>
                  <span className="text-muted-foreground">
                    {t('perInterval', { interval: plan.interval || 'month' })}
                  </span>
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                  {plan.trialDays > 0 && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="text-sm">
                        {t('trialDays', { days: plan.trialDays })}
                      </span>
                    </li>
                  )}
                </ul>
              </CardContent>

              <CardFooter>
                {isCurrentPlan ? (
                  <Button className="w-full" variant="secondary" disabled>
                    <Check className="mr-2 h-4 w-4" />
                    {t('currentPlanBadge')}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => handleUpgrade(plan.name, plan.priceId)}
                    disabled={loading === plan.name}
                  >
                    {loading === plan.name
                      ? tCommon('loading')
                      : currentPlan
                        ? t('switchPlan')
                        : t('getStarted')}
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>{t('footer.guarantee')}</p>
        <p className="mt-2">
          {t('footer.custom')}{' '}
          <Link href="/help" className="underline hover:text-foreground">
            {t('footer.contactUs')}
          </Link>
        </p>
      </div>
    </div>
  )
}
