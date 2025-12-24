'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { GalleryVerticalEnd } from 'lucide-react'
import { SignupForm } from '@/components/auth/signup-form'
import { ThemeToggle } from '@/components/theme-toggle'

function RegisterPageContent() {
  const searchParams = useSearchParams()
  const defaultEmail = searchParams.get('email') || ''
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-between items-center md:justify-start md:gap-2">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            AuthApp
          </Link>
          <div className="md:ml-auto">
            <ThemeToggle />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <SignupForm defaultEmail={defaultEmail} callbackUrl={callbackUrl} />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
          src="https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80"
          alt="Registration"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  )
}
