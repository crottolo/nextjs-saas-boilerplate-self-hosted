import Link from 'next/link'
import { GalleryVerticalEnd } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export default function TwoFactorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <div className="flex justify-between items-center p-6 md:px-10">
        <Link href="/" className="flex items-center gap-2 font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          AuthApp
        </Link>
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
