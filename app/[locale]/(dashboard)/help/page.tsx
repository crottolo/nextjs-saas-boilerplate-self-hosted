'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { HelpCircle, Mail, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

export default function HelpPage() {
  const t = useTranslations('help')

  const faqKeys = [
    'q1',
    'q2',
    'q3',
    'q4',
    'q5',
    'q6',
    'q7',
    'q8',
    'q9',
    'q10',
  ] as const

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">{t('description')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            {t('faqTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqKeys.map((key, index) => (
              <AccordionItem key={key} value={`item-${index}`}>
                <AccordionTrigger>{t(`faq.${key}`)}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {t(`faq.a${index + 1}`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('stillNeedHelp')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Button variant="outline" asChild className="flex-1">
            <a href="mailto:support@authapp.com">
              <Mail className="mr-2 h-4 w-4" />
              {t('emailSupport')}
            </a>
          </Button>
          <Button variant="outline" asChild className="flex-1">
            <Link href="/privacy">
              <MessageCircle className="mr-2 h-4 w-4" />
              {t('privacyPolicy')}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
