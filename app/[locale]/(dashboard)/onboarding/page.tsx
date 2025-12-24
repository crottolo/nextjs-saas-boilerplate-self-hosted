'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authClient, useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Check, ChevronRight, Sparkles, Building2, Palette } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'

type Step = 'welcome' | 'organization' | 'preferences' | 'complete'

export default function OnboardingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { data: organizations } = authClient.useListOrganizations()
  const { setTheme, theme } = useTheme()
  const t = useTranslations('onboarding')
  const tTheme = useTranslations('theme')
  const [currentStep, setCurrentStep] = useState<Step>('welcome')
  const [loading, setLoading] = useState(false)

  const steps: { id: Step; title: string; icon: React.ReactNode }[] = [
    {
      id: 'welcome',
      title: t('steps.welcome'),
      icon: <Sparkles className="h-5 w-5" />,
    },
    {
      id: 'organization',
      title: t('steps.workspace'),
      icon: <Building2 className="h-5 w-5" />,
    },
    {
      id: 'preferences',
      title: t('steps.preferences'),
      icon: <Palette className="h-5 w-5" />,
    },
    {
      id: 'complete',
      title: t('steps.complete'),
      icon: <Check className="h-5 w-5" />,
    },
  ]

  const [name, setName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [selectedTheme, setSelectedTheme] = useState<string>('system')

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name)
    }
    if (theme) {
      setSelectedTheme(theme)
    }
  }, [session, theme])

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep)

  const handleNext = async () => {
    setLoading(true)
    try {
      if (currentStep === 'welcome') {
        if (name && name !== session?.user?.name) {
          await authClient.updateUser({ name })
        }
        setCurrentStep('organization')
      } else if (currentStep === 'organization') {
        if (orgName && (!organizations || organizations.length === 0)) {
          const slug = orgName.toLowerCase().replace(/\s+/g, '-')
          await authClient.organization.create({
            name: orgName,
            slug: `${slug}-${Date.now().toString(36)}`,
          })
        }
        setCurrentStep('preferences')
      } else if (currentStep === 'preferences') {
        setTheme(selectedTheme)
        await authClient.updateUser({
          theme: selectedTheme,
          onboardingCompleted: true,
        })
        setCurrentStep('complete')
      } else if (currentStep === 'complete') {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Onboarding error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = async () => {
    setLoading(true)
    try {
      await authClient.updateUser({ onboardingCompleted: true })
      router.push('/dashboard')
    } catch {
      toast.error('Failed to skip onboarding')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    index <= currentStepIndex
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-muted-foreground/30 text-muted-foreground'
                  }`}
                >
                  {index < currentStepIndex ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-1 transition-colors ${
                      index < currentStepIndex
                        ? 'bg-primary'
                        : 'bg-muted-foreground/30'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {currentStep === 'welcome' && t('welcome.title')}
              {currentStep === 'organization' && t('workspace.title')}
              {currentStep === 'preferences' && t('preferences.title')}
              {currentStep === 'complete' && t('complete.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 'welcome' && (
              <div className="space-y-4">
                <p className="text-muted-foreground text-center">
                  {t('welcome.description')}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="name">{t('welcome.name')}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('welcome.namePlaceholder')}
                  />
                </div>
              </div>
            )}

            {currentStep === 'organization' && (
              <div className="space-y-4">
                <p className="text-muted-foreground text-center">
                  {organizations && organizations.length > 0
                    ? t('workspace.hasWorkspace')
                    : t('workspace.noWorkspace')}
                </p>
                {(!organizations || organizations.length === 0) && (
                  <div className="space-y-2">
                    <Label htmlFor="orgName">{t('workspace.name')}</Label>
                    <Input
                      id="orgName"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder={t('workspace.namePlaceholder')}
                    />
                  </div>
                )}
                {organizations && organizations.length > 0 && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium">
                      {t('workspace.yourWorkspaces')}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {organizations.map((org) => (
                        <li
                          key={org.id}
                          className="text-sm text-muted-foreground"
                        >
                          • {org.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {currentStep === 'preferences' && (
              <div className="space-y-4">
                <p className="text-muted-foreground text-center">
                  {t('preferences.description')}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="theme">{t('preferences.theme')}</Label>
                  <Select
                    value={selectedTheme}
                    onValueChange={setSelectedTheme}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">{tTheme('light')}</SelectItem>
                      <SelectItem value="dark">{tTheme('dark')}</SelectItem>
                      <SelectItem value="system">{tTheme('system')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {currentStep === 'complete' && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <p className="text-muted-foreground">
                  {t('complete.description')}
                </p>
              </div>
            )}

            <div className="flex justify-between pt-4">
              {currentStep !== 'complete' && (
                <Button variant="ghost" onClick={handleSkip} disabled={loading}>
                  {t('skip')}
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={loading}
                className={currentStep === 'complete' ? 'w-full' : 'ml-auto'}
              >
                {loading ? (
                  t('loading')
                ) : currentStep === 'complete' ? (
                  t('goToDashboard')
                ) : (
                  <>
                    {t('continue')}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
