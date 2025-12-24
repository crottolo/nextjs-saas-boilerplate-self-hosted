'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useSession } from '@/lib/auth-client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const { data: session } = useSession()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('welcomeBack', { name: session?.user.name || t('user') })}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t('account.title')}</CardTitle>
            <CardDescription>{t('account.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground">{t('account.email')}</dt>
                <dd className="font-medium">{session?.user.email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('account.name')}</dt>
                <dd className="font-medium">
                  {session?.user.name || t('account.notSet')}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">
                  {t('account.twoFactor')}
                </dt>
                <dd className="font-medium">
                  {session?.user.twoFactorEnabled
                    ? t('account.enabled')
                    : t('account.disabled')}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('session.title')}</CardTitle>
            <CardDescription>{t('session.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground">{t('session.id')}</dt>
                <dd className="font-medium font-mono text-xs truncate">
                  {session?.session.id}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">
                  {t('session.created')}
                </dt>
                <dd className="font-medium">
                  {session?.session.createdAt
                    ? new Date(session.session.createdAt).toLocaleDateString()
                    : t('session.unknown')}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('quickActions.title')}</CardTitle>
            <CardDescription>{t('quickActions.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/profile"
              className="block text-sm text-primary hover:underline"
            >
              {t('quickActions.updateProfile')} →
            </Link>
            <Link
              href="/profile"
              className="block text-sm text-primary hover:underline"
            >
              {t('quickActions.securitySettings')} →
            </Link>
            <Link
              href="/organizations"
              className="block text-sm text-primary hover:underline"
            >
              {t('quickActions.manageOrganizations')} →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
