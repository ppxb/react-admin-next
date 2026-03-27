import { Card, CardContent } from '@/components/ui/card'
import { FieldDescription } from '@/components/ui/field'
import { Ripple } from '@/components/ui/ripple'
import { AccountLogin } from './components/account-login'

export function LoginPage() {
  const appTitle = import.meta.env.VITE_APP_TITLE

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <div className="mb-8 flex items-center justify-between md:justify-end">
          <div className="flex items-center gap-2 md:hidden">
            <svg
              aria-label="logomark"
              height="22"
              role="img"
              className="w-auto overflow-visible"
              viewBox="0 0 74 64"
            >
              <path
                d="M37.5896 0.25L74.5396 64.25H0.639648L37.5896 0.25Z"
                fill="var(--geist-foreground)"
              ></path>
            </svg>
            <div className="font-bold md:text-lg">{appTitle}</div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden p-0">
            <CardContent className="grid p-0 md:grid-cols-2">
              <AccountLogin />
              <div className="relative hidden justify-end bg-background md:flex">
                <div className="flex h-fit items-center gap-2 p-8">
                  <svg
                    aria-label="logomark"
                    height="22"
                    role="img"
                    className="w-auto overflow-visible"
                    viewBox="0 0 74 64"
                  >
                    <path d="M37.5896 0.25L74.5396 64.25H0.639648L37.5896 0.25Z"></path>
                  </svg>
                  <div className="font-bold md:text-lg">{appTitle}</div>
                </div>
                <Ripple />
              </div>
            </CardContent>
          </Card>
          <FieldDescription className="px-6 text-center">
            © 2026 ppxb. All rights reserved.
          </FieldDescription>
        </div>
      </div>
    </div>
  )
}
