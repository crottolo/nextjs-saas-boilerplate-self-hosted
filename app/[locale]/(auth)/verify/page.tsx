import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default async function VerifyPage() {
  const t = await getTranslations('verify')

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('title')}</CardTitle>
        <CardDescription>{t('message')}</CardDescription>
      </CardHeader>
      <CardContent className="text-center text-sm text-muted-foreground">
        <p>{t('hint')}</p>
      </CardContent>
      <CardFooter className="justify-center">
        <Link href="/login">
          <Button variant="outline">{t('backToLogin')}</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
