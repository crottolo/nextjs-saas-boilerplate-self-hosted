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

type Step = 'welcome' | 'organization' | 'preferences' | 'complete'

const steps: { id: Step; title: string; icon: React.ReactNode }[] = [
  { id: 'welcome', title: 'Welcome', icon: <Sparkles className="h-5 w-5" /> },
  {
    id: 'organization',
    title: 'Workspace',
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    id: 'preferences',
    title: 'Preferences',
    icon: <Palette className="h-5 w-5" />,
  },
  { id: 'complete', title: 'Complete', icon: <Check className="h-5 w-5" /> },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { data: organizations } = authClient.useListOrganizations()
  const { setTheme, theme } = useTheme()
  const [currentStep, setCurrentStep] = useState<Step>('welcome')
  const [loading, setLoading] = useState(false)

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
              {currentStep === 'welcome' && 'Welcome to AuthApp!'}
              {currentStep === 'organization' && 'Set up your workspace'}
              {currentStep === 'preferences' && 'Your preferences'}
              {currentStep === 'complete' && "You're all set!"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 'welcome' && (
              <div className="space-y-4">
                <p className="text-muted-foreground text-center">
                  Let&apos;s get you set up. This will only take a minute.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="name">Your name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
              </div>
            )}

            {currentStep === 'organization' && (
              <div className="space-y-4">
                <p className="text-muted-foreground text-center">
                  {organizations && organizations.length > 0
                    ? 'You already have a workspace. You can continue or create a new one.'
                    : 'Create your first workspace to get started.'}
                </p>
                {(!organizations || organizations.length === 0) && (
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Workspace name</Label>
                    <Input
                      id="orgName"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="My Workspace"
                    />
                  </div>
                )}
                {organizations && organizations.length > 0 && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Your workspaces:</p>
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
                  Customize your experience.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={selectedTheme}
                    onValueChange={setSelectedTheme}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
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
                  Your account is ready. Let&apos;s get started!
                </p>
              </div>
            )}

            <div className="flex justify-between pt-4">
              {currentStep !== 'complete' && (
                <Button variant="ghost" onClick={handleSkip} disabled={loading}>
                  Skip
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={loading}
                className={currentStep === 'complete' ? 'w-full' : 'ml-auto'}
              >
                {loading ? (
                  'Loading...'
                ) : currentStep === 'complete' ? (
                  'Go to Dashboard'
                ) : (
                  <>
                    Continue
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
