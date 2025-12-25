'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import {
  Check,
  Crown,
  Loader2,
  AlertCircle,
  Building2,
  Zap,
  Infinity,
} from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PlanPrice {
  id: string
  productId: string
  price: number
  currency: string
  interval: string | null
  trialDays: number
}

interface Plan {
  id: string
  name: string
  description: string | null
  credits: number
  maxOrganizations: number
  isDefault: boolean | null
  features: string[]
  popular: boolean
  prices: PlanPrice[]
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
  const [isYearly, setIsYearly] = useState(false)
  const [subscription, setSubscription] = useState<{
    status?: string
    cancelAtPeriodEnd?: boolean
    periodEnd?: string
  } | null>(null)
  const [downgradeDialog, setDowngradeDialog] = useState<{
    open: boolean
    currentOrgs: number
    targetMax: number
    toDelete: number
  }>({ open: false, currentOrgs: 0, targetMax: 0, toDelete: 0 })

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

  async function handleUpgrade(planId: string, priceId: string) {
    setLoading(planId)
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
      } else if (data.error === 'downgrade_blocked' && data.details) {
        // Show downgrade dialog with details
        setDowngradeDialog({
          open: true,
          currentOrgs: data.details.currentOrgs,
          targetMax: data.details.targetMax,
          toDelete: data.details.toDelete,
        })
      } else {
        toast.error(data.message || data.error || 'Failed to start checkout')
      }
    } catch {
      toast.error('Failed to start upgrade')
    } finally {
      setLoading(null)
    }
  }

  // Get the price for a plan based on current interval toggle
  function getPlanPrice(plan: Plan): PlanPrice | null {
    if (plan.prices.length === 0) return null
    const targetInterval = isYearly ? 'year' : 'month'
    return (
      plan.prices.find((p) => p.interval === targetInterval) || plan.prices[0]
    )
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

  // Check if we have yearly prices available
  const hasYearlyPrices = plans.some((plan) =>
    plan.prices.some((p) => p.interval === 'year')
  )

  return (
    <div className="container max-w-5xl py-8 mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {/* Monthly/Yearly Toggle */}
      {hasYearlyPrices && (
        <div className="flex items-center justify-center gap-3 mb-8">
          <Label
            htmlFor="billing-toggle"
            className={cn(
              'cursor-pointer transition-colors',
              !isYearly
                ? 'text-foreground font-medium'
                : 'text-muted-foreground'
            )}
          >
            {t('monthly')}
          </Label>
          <Switch
            id="billing-toggle"
            checked={isYearly}
            onCheckedChange={setIsYearly}
          />
          <Label
            htmlFor="billing-toggle"
            className={cn(
              'cursor-pointer transition-colors',
              isYearly ? 'text-foreground font-medium' : 'text-muted-foreground'
            )}
          >
            {t('yearly')}
            <Badge variant="secondary" className="ml-2">
              {t('savePercent', { percent: 20 })}
            </Badge>
          </Label>
        </div>
      )}

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
          const isCurrentPlan = activePlan === plan.id
          const price = getPlanPrice(plan)

          return (
            <Card
              key={plan.id}
              className={cn(
                'relative transition-all flex flex-col',
                isCurrentPlan &&
                  'border-2 border-primary ring-2 ring-primary/20 shadow-lg',
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

              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {plan.name}
                  {isCurrentPlan && <Check className="h-5 w-5 text-primary" />}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  {price ? (
                    <>
                      <span className="text-4xl font-bold">
                        {formatPrice(price.price, price.currency)}
                      </span>
                      <span className="text-muted-foreground">
                        {t('perInterval', {
                          interval: price.interval || 'month',
                        })}
                      </span>
                    </>
                  ) : (
                    <span className="text-4xl font-bold">{t('free')}</span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                {/* Limits Section */}
                <div className="mb-4 p-3 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {plan.maxOrganizations === -1 ? (
                        <span className="flex items-center gap-1">
                          <Infinity className="h-4 w-4" />
                          {t('limits.unlimitedOrgs')}
                        </span>
                      ) : (
                        t('limits.organizations', {
                          count: plan.maxOrganizations,
                        })
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {t('limits.credits', {
                        count: plan.credits.toLocaleString(),
                      })}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                  {price && price.trialDays > 0 && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="text-sm">
                        {t('trialDays', { days: price.trialDays })}
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
                ) : plan.isDefault ? (
                  <Button className="w-full" variant="outline" disabled>
                    {t('freePlan')}
                  </Button>
                ) : price ? (
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => handleUpgrade(plan.id, price.id)}
                    disabled={loading === plan.id}
                  >
                    {loading === plan.id
                      ? tCommon('loading')
                      : currentPlan
                        ? t('switchPlan')
                        : t('getStarted')}
                  </Button>
                ) : (
                  <Button className="w-full" variant="outline" disabled>
                    {t('noPrice')}
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

      {/* Downgrade Blocked Dialog */}
      <Dialog
        open={downgradeDialog.open}
        onOpenChange={(open) =>
          setDowngradeDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              {t('downgrade.title')}
            </DialogTitle>
            <DialogDescription>{t('downgrade.description')}</DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <Building2 className="h-4 w-4" />
            <AlertTitle>{t('downgrade.alertTitle')}</AlertTitle>
            <AlertDescription>
              {t('downgrade.alertText', {
                current: downgradeDialog.currentOrgs,
                max: downgradeDialog.targetMax,
                toDelete: downgradeDialog.toDelete,
              })}
            </AlertDescription>
          </Alert>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() =>
                setDowngradeDialog((prev) => ({ ...prev, open: false }))
              }
            >
              {tCommon('cancel')}
            </Button>
            <Button asChild>
              <Link href="/organizations">
                <Building2 className="mr-2 h-4 w-4" />
                {t('downgrade.manageOrgs')}
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
