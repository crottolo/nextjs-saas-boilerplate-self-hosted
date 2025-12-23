'use client'

import Link from 'next/link'
import Image from 'next/image'
import { GalleryVerticalEnd } from 'lucide-react'
import { SignupForm } from '@/components/auth/signup-form'
import { ThemeToggle } from '@/components/theme-toggle'

export default function RegisterPage() {
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
            <SignupForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
          src="https://placehold.co/1920x1080/1a1a2e/eaeaea?text=Register"
          alt="Registration"
          fill
          className="object-cover dark:brightness-[0.2] dark:grayscale"
          priority
        />
      </div>
    </div>
  )
}
