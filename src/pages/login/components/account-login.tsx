import type { FormEvent } from 'react'
import { useForm } from '@tanstack/react-form'
import { Link, useNavigate } from '@tanstack/react-router'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import { authApi } from '@/api'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { HttpError } from '@/lib/http'
import { useAuthStore } from '@/stores/auth'

const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required.'),
  password: z.string().trim().min(1, 'Password is required.'),
  tenantId: z.string().trim().min(1, 'Please select a tenant.'),
  captchaCode: z.string().trim().min(1, 'Captcha is required.')
})

type LoginFormValues = z.infer<typeof loginSchema>

function asCaptchaImage(base64Img?: string) {
  return base64Img ? `data:image/png;base64,${base64Img}` : ''
}

function getErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Login failed, please retry.'
}

function getFieldError(errors: unknown[]) {
  const message = errors[0]
  return typeof message === 'string' ? message : undefined
}

export function AccountLogin() {
  const navigate = useNavigate()
  const login = useAuthStore(state => state.login)
  const isLoggingIn = useAuthStore(state => state.isLoggingIn)

  const [isLoading, setIsLoading] = useState(false)

  const [tenants, setTenants] = useState<Api.TenantListVo[]>([])
  const [tenantEnabled, setTenantEnabled] = useState(false)
  const [captchaEnabled, setCaptchaEnabled] = useState(false)
  const [captchaUuid, setCaptchaUuid] = useState<string>()
  const [captchaImage, setCaptchaImage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [initializing, setInitializing] = useState(true)
  const [captchaLoading, setCaptchaLoading] = useState(false)

  const form = useForm({
    defaultValues: {
      username: 'admin',
      password: 'admin123',
      tenantId: '',
      captchaCode: ''
    } satisfies LoginFormValues,
    onSubmit: async ({ value }) => {
      setIsLoading(true)
      const payload = {
        username: value.username,
        password: value.password,
        tenantId: tenantEnabled ? value.tenantId : undefined,
        code: captchaEnabled ? value.captchaCode : undefined,
        uuid: captchaEnabled ? captchaUuid : undefined
      }

      try {
        await login(payload)
        toast.success('Login successful.')
        await navigate({ to: '/' })
      } catch (submitError) {
        toast.error(getErrorMessage(submitError))

        if (captchaEnabled) {
          form.setFieldValue('captchaCode', '')
          try {
            await refreshCaptcha()
          } catch {
            // Keep login error as the primary feedback.
          }
        }
      } finally {
        setIsLoading(false)
      }
    }
  })

  const tenantOptions = useMemo(
    () => tenants.map(item => ({ label: item.companyName, value: item.tenantId })),
    [tenants]
  )

  const tenantSelectDisabled = initializing || isLoggingIn || tenantOptions.length === 0

  const refreshCaptcha = async () => {
    setCaptchaLoading(true)
    try {
      const captcha = await authApi.getCaptcha()
      const nextCaptchaEnabled = Boolean(captcha.captchaEnabled)

      setCaptchaEnabled(nextCaptchaEnabled)
      setCaptchaUuid(captcha.uuid)
      setCaptchaImage(asCaptchaImage(captcha.img))

      if (!nextCaptchaEnabled) {
        form.setFieldValue('captchaCode', '')
      }
    } finally {
      setCaptchaLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    const init = async () => {
      setInitializing(true)

      const [tenantResult, captchaResult] = await Promise.allSettled([
        authApi.getLoginTenants(),
        authApi.getCaptcha()
      ])

      if (!active) {
        return
      }

      if (tenantResult.status === 'fulfilled') {
        const payload = tenantResult.value
        const tenantList = payload.voList ?? []
        const nextTenantEnabled = Boolean(payload.tenantEnabled)

        setTenantEnabled(nextTenantEnabled)
        setTenants(tenantList)

        if (nextTenantEnabled && tenantList.length > 0) {
          form.setFieldValue('tenantId', tenantList[0]?.tenantId ?? '')
        } else {
          form.setFieldValue('tenantId', '')
        }
      } else {
        toast.error(getErrorMessage(tenantResult.reason))
      }

      if (captchaResult.status === 'fulfilled') {
        const captcha = captchaResult.value
        const nextCaptchaEnabled = Boolean(captcha.captchaEnabled)

        setCaptchaEnabled(nextCaptchaEnabled)
        setCaptchaUuid(captcha.uuid)
        setCaptchaImage(asCaptchaImage(captcha.img))

        if (!nextCaptchaEnabled) {
          form.setFieldValue('captchaCode', '')
        }
      } else {
        toast.error(getErrorMessage(captchaResult.reason))
      }

      setInitializing(false)
    }

    void init()

    return () => {
      active = false
    }
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    event.stopPropagation()
    void form.handleSubmit()
  }

  return (
    <form id="login-form" className="p-6 md:p-8" onSubmit={handleSubmit}>
      <FieldGroup>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Please login to your account to get started.
          </p>
        </div>

        {tenantEnabled && (
          <form.Field
            name="tenantId"
            validators={{
              onBlur: loginSchema.shape.tenantId,
              onSubmit: loginSchema.shape.tenantId
            }}
          >
            {field => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <Select
                  disabled={tenantSelectDisabled}
                  value={field.state.value || undefined}
                  onValueChange={value => {
                    field.handleChange(value)
                    field.handleBlur()
                  }}
                >
                  <SelectTrigger id="tenantId">
                    <SelectValue
                      placeholder={
                        tenantOptions.length > 0 ? 'Select tenant' : 'No tenant available'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {tenantOptions.length > 0 ? (
                      tenantOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="__tenant_empty" disabled>
                        No tenant available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FieldError>{getFieldError(field.state.meta.errors)}</FieldError>
              </Field>
            )}
          </form.Field>
        )}

        <form.Field
          name="username"
          validators={{
            onBlur: loginSchema.shape.username,
            onSubmit: loginSchema.shape.username
          }}
        >
          {field => (
            <Field data-invalid={field.state.meta.errors.length > 0}>
              <Input
                id="username"
                autoComplete="username"
                disabled={isLoading}
                onBlur={field.handleBlur}
                onChange={event => field.handleChange(event.target.value)}
                placeholder="Enter your username"
                value={field.state.value}
                className="text-sm"
              />
              <FieldError>{getFieldError(field.state.meta.errors)}</FieldError>
            </Field>
          )}
        </form.Field>
        <form.Field
          name="password"
          validators={{
            onBlur: loginSchema.shape.password,
            onSubmit: loginSchema.shape.password
          }}
        >
          {field => (
            <Field data-invalid={field.state.meta.errors.length > 0}>
              <div className="relative">
                <Input
                  id="password"
                  autoComplete="current-password"
                  disabled={isLoading}
                  onBlur={field.handleBlur}
                  onChange={event => field.handleChange(event.target.value)}
                  placeholder="Enter your password"
                  type={showPassword ? 'text' : 'password'}
                  value={field.state.value}
                  className="pr-10 text-sm [&::-ms-clear]:hidden [&::-ms-reveal]:hidden"
                />
                <button
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:cursor-pointer hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading}
                  onClick={() => setShowPassword(prev => !prev)}
                  type="button"
                >
                  {showPassword ? (
                    <EyeOffIcon className="size-4" />
                  ) : (
                    <EyeIcon className="size-4" />
                  )}
                </button>
              </div>
              <FieldError>{getFieldError(field.state.meta.errors)}</FieldError>
              <FieldDescription className="text-right">
                <Link to="/" className="underline hover:cursor-pointer hover:text-foreground">
                  Forgot your password?
                </Link>
              </FieldDescription>
            </Field>
          )}
        </form.Field>

        {captchaEnabled && (
          <form.Field
            name="captchaCode"
            validators={{
              onBlur: loginSchema.shape.captchaCode,
              onSubmit: loginSchema.shape.captchaCode
            }}
          >
            {field => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <div className="flex gap-2">
                  <Input
                    id="captchaCode"
                    className="flex-1 text-sm"
                    onBlur={field.handleBlur}
                    onChange={event => field.handleChange(event.target.value)}
                    placeholder="Enter the captcha"
                    value={field.state.value}
                  />
                  <button
                    className="relative h-8 overflow-hidden rounded-lg border hover:cursor-pointer"
                    onClick={refreshCaptcha}
                    type="button"
                  >
                    {captchaImage ? (
                      <img
                        alt="captcha"
                        className="h-full w-full object-cover"
                        src={captchaImage}
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-xs text-muted-foreground">
                        Reload
                      </span>
                    )}
                    {captchaLoading && (
                      <span className="absolute inset-0 grid place-items-center bg-black/45 text-xs text-white">
                        Loading
                      </span>
                    )}
                  </button>
                </div>
                <FieldError>{getFieldError(field.state.meta.errors)}</FieldError>
              </Field>
            )}
          </form.Field>
        )}

        <form.Subscribe selector={state => state.isSubmitting}>
          {isSubmitting => (
            <Field>
              <Button
                aria-busy={isLoggingIn || isSubmitting}
                disabled={initializing || isLoggingIn || isSubmitting}
                type="submit"
              >
                {isLoggingIn || isSubmitting ? (
                  <>
                    <Spinner className="size-4" />
                    Login In...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </Field>
          )}
        </form.Subscribe>
        <FieldDescription className="text-center">
          <span className="mr-2">Don't have an account?</span>
          <Link to="/" className="underline">
            Sign Up
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}
