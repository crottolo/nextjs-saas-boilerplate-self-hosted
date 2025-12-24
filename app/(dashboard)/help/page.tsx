'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { HelpCircle, Mail, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const faqs = [
  {
    question: 'How do I enable two-factor authentication?',
    answer:
      'Go to Profile > Security tab and click on "Enable Two-Factor Authentication". You will need an authenticator app like Google Authenticator or Authy to scan the QR code.',
  },
  {
    question: 'How do I change my password?',
    answer:
      'Navigate to Profile > Security tab. If you have an existing password, you can change it there. If you signed up with OAuth, you can set a password from the same page.',
  },
  {
    question: 'How do I create an organization?',
    answer:
      'Go to the Organizations page and click "Create Organization". Enter a name and your organization will be created. You can then invite members to join.',
  },
  {
    question: 'How do I invite team members?',
    answer:
      'From the Organizations page, select your organization and click "Invite Members". Enter their email address and select a role. They will receive an email invitation.',
  },
  {
    question: 'How do I upgrade my subscription?',
    answer:
      'Visit the Pricing page to view available plans. Click "Upgrade" on your desired plan to proceed with the payment through our secure Stripe checkout.',
  },
  {
    question: 'How do I manage my billing?',
    answer:
      'Go to Pricing and click "Manage Subscription". This will open the Stripe Customer Portal where you can update payment methods, view invoices, and manage your subscription.',
  },
  {
    question: 'How do I sign out from all devices?',
    answer:
      'Go to Profile > Sessions tab. You can see all active sessions and click "Revoke Other Sessions" to sign out from all devices except your current one.',
  },
  {
    question: 'What happens if I forget my password?',
    answer:
      'On the login page, click "Forgot Password". Enter your email address and we will send you a link to reset your password.',
  },
  {
    question: 'How do I delete my account?',
    answer:
      'Account deletion is currently handled through support. Please contact us at support@authapp.com and we will process your request.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes, we use industry-standard encryption for all data in transit and at rest. Passwords are securely hashed, and we support two-factor authentication for additional security.',
  },
]

export default function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Help & FAQ</h1>
        <p className="text-muted-foreground mt-2">
          Find answers to common questions or contact our support team.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Still need help?</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Button variant="outline" asChild className="flex-1">
            <Link href="mailto:support@authapp.com">
              <Mail className="mr-2 h-4 w-4" />
              Email Support
            </Link>
          </Button>
          <Button variant="outline" asChild className="flex-1">
            <Link href="/privacy">
              <MessageCircle className="mr-2 h-4 w-4" />
              Privacy Policy
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
