import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function VerifyPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Check your email</CardTitle>
        <CardDescription>
          We&apos;ve sent you a verification link. Please check your email to verify your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center text-sm text-muted-foreground">
        <p>
          Didn&apos;t receive the email? Check your spam folder or try signing in again to resend.
        </p>
      </CardContent>
      <CardFooter className="justify-center">
        <Link href="/login">
          <Button variant="outline">Back to login</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
