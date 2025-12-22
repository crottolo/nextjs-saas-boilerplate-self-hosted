"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function TwoFactorSetupPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"password" | "qr" | "verify">("password")
  const [totpUri, setTotpUri] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])

  async function handleEnableTwoFactor(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const password = formData.get("password") as string

    const { data, error } = await authClient.twoFactor.enable({
      password,
    })

    if (error) {
      setError(error.message || "Failed to enable 2FA")
      setLoading(false)
    } else if (data) {
      setTotpUri(data.totpURI)
      setBackupCodes(data.backupCodes)
      setStep("qr")
      setLoading(false)
    }
  }

  async function handleVerifyCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const code = formData.get("code") as string

    const { error } = await authClient.twoFactor.verifyTotp({
      code,
    })

    if (error) {
      setError(error.message || "Invalid code")
      setLoading(false)
    } else {
      router.push("/settings/security")
    }
  }

  if (step === "password") {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Enable Two-Factor Authentication</CardTitle>
          <CardDescription>
            Enter your password to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEnableTwoFactor} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enabling..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  if (step === "qr") {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Scan QR Code</CardTitle>
          <CardDescription>
            Scan this code with your authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center p-4 bg-white rounded-lg">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpUri)}`}
              alt="QR Code"
              width={200}
              height={200}
            />
          </div>

          <div className="space-y-2">
            <Label>Manual Entry Code</Label>
            <p className="text-xs font-mono bg-muted p-2 rounded break-all">
              {totpUri.split("secret=")[1]?.split("&")[0] || ""}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Backup Codes</Label>
            <p className="text-xs text-muted-foreground">
              Save these codes in a safe place. You can use them to access your account if you lose your device.
            </p>
            <div className="grid grid-cols-2 gap-2 bg-muted p-3 rounded font-mono text-xs">
              {backupCodes.map((code, i) => (
                <span key={i}>{code}</span>
              ))}
            </div>
          </div>

          <Button className="w-full" onClick={() => setStep("verify")}>
            I&apos;ve saved my backup codes
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Verify Setup</CardTitle>
        <CardDescription>
          Enter a code from your authenticator app to complete setup
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              name="code"
              type="text"
              placeholder="000000"
              maxLength={6}
              pattern="[0-9]{6}"
              className="text-center text-2xl tracking-widest"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Verifying..." : "Complete Setup"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
