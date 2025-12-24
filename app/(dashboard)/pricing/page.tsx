'use client'

import { useState, useEffect } from 'react'
import { Check, Crown } from 'lucide-react'
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
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Plan {
  name: string
  price: string
  description: string
  features: string[]
  popular?: boolean
  priceId: string
}

const plans: Plan[] = [
  {
    name: 'Free',
    price: '€0',
    description: 'For individuals just getting started',
    priceId: 'price_1ShnG5HkRKq5DDJHngiNkwFL',
    features: [
      '3 projects',
      '1 GB storage',
      'Community support',
      'Basic access',
    ],
  },
  {
    name: 'Pro',
    price: '€19',
    description: 'For professionals and small teams',
    priceId: 'price_1ShnGWHkRKq5DDJHfQzl1IZb',
    popular: true,
    features: [
      '20 projects',
      '50 GB storage',
      'Priority support',
      '14-day free trial',
      'Advanced analytics',
      'API access',
    ],
  },
  {
    name: 'Enterprise',
    price: '€99',
    description: 'For large organizations',
    priceId: 'price_1ShnGpHkRKq5DDJHaMkkLqwB',
    features: [
      'Unlimited projects',
      'Unlimited storage',
      '24/7 dedicated support',
      'Custom integrations',
      'SLA guarantee',
      'On-premise option',
    ],
  },
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<{
    status?: string
    cancelAtPeriodEnd?: boolean
    periodEnd?: string
  } | null>(null)

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const { data } = await authClient.subscription.list()
        if (data && data.length > 0) {
          const activeSub = data.find(
            (s) => s.status === 'active' || s.status === 'trialing'
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

  async function handleUpgrade(planName: string) {
    setLoading(planName)
    try {
      const { error } = await authClient.subscription.upgrade({
        plan: planName.toLowerCase(),
        successUrl: `${window.location.origin}/dashboard?upgraded=true`,
        cancelUrl: `${window.location.origin}/pricing`,
      })
      if (error) {
        toast.error(error.message || 'Failed to upgrade')
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
      const { data, error } = await authClient.subscription.billingPortal({
        returnUrl: `${window.location.origin}/pricing`,
      })
      if (error) {
        toast.error(error.message || 'Failed to open billing portal')
      } else if (data?.url) {
        window.location.href = data.url
      }
    } catch {
      toast.error('Failed to open billing portal')
    } finally {
      setLoading(null)
    }
  }

  // Determina il piano attuale (se nessun abbonamento = Free)
  const activePlan = currentPlan || 'free'

  return (
    <div className="container max-w-5xl py-8 mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-2">Choose your plan</h1>
        <p className="text-muted-foreground">
          Start free and upgrade as you grow
        </p>
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
                  Current plan:{' '}
                  <span className="capitalize text-primary">{currentPlan}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {subscription.status === 'trialing' && 'Trial · '}
                  {subscription.status === 'active' && 'Active · '}
                  {subscription.cancelAtPeriodEnd && 'Cancels on '}
                  {!subscription.cancelAtPeriodEnd && 'Renews on '}
                  {subscription.periodEnd}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleManageBilling}
              disabled={loading === 'billing'}
            >
              {loading === 'billing' ? 'Loading...' : 'Manage Subscription'}
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
              key={plan.name}
              className={cn(
                'relative transition-all',
                isCurrentPlan &&
                  'border-2 border-primary ring-2 ring-primary/20 shadow-lg bg-secondary',
                plan.popular && !isCurrentPlan && 'border-primary/50 shadow-md'
              )}
            >
              {/* Current plan badge */}
              {isCurrentPlan && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Current Plan
                </Badge>
              )}
              {/* Popular badge (only if not current plan) */}
              {plan.popular && !isCurrentPlan && (
                <Badge
                  variant="secondary"
                  className="absolute -top-3 left-1/2 -translate-x-1/2"
                >
                  Most Popular
                </Badge>
              )}

              <CardHeader className={cn(isCurrentPlan && 'bg-primary/5')}>
                <CardTitle className="flex items-center gap-2">
                  {plan.name}
                  {isCurrentPlan && <Check className="h-5 w-5 text-primary" />}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/mese</span>
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                {isCurrentPlan ? (
                  <Button className="w-full" variant="secondary" disabled>
                    <Check className="mr-2 h-4 w-4" />
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => handleUpgrade(plan.name)}
                    disabled={loading === plan.name}
                  >
                    {loading === plan.name
                      ? 'Loading...'
                      : currentPlan
                        ? 'Switch Plan'
                        : 'Get Started'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>All plans include a 14-day money-back guarantee</p>
        <p className="mt-2">
          Need something custom?{' '}
          <a href="/contact" className="underline hover:text-foreground">
            Contact us
          </a>
        </p>
      </div>
    </div>
  )
}
