import { useForm } from '@tanstack/react-form'
import { Link, useNavigate } from '@tanstack/react-router'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { getErrorMessage } from '@/lib/http'
import { useAuthStore } from '@/stores/auth'

const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().trim().min(1, 'Password is required'),
  tenantId: z.string().trim().min(1, 'Please select a tenant'),
  captchaCode: z.string().trim().min(1, 'Captcha is required')
})

type LoginFormValues = z.infer<typeof loginSchema>

function getFieldError(errors: unknown[]): string | undefined {
  for (const error of errors) {
    if (typeof error === 'string') {
      return error
    }
    if (Array.isArray(error)) {
      const nested = getFieldError(error)
      if (nested) {
        return nested
      }
    }
    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      return error.message
    }
  }
}

export function AccountLogin() {
  const navigate = useNavigate()
  const login = useAuthStore(state => state.login)

  const [showPassword, setShowPassword] = useState(false)

  const form = useForm({
    defaultValues: {
      username: 'admin',
      password: 'admin123',
      tenantId: '',
      captchaCode: ''
    } satisfies LoginFormValues,
    onSubmit: async ({ value }) => {
      const payload = {
        username: value.username,
        password: value.password,
        tenantId: value.tenantId,
        code: value.captchaCode,
        uuid: captchaInfo.uuid
      }

      try {
        await login(payload)
        toast.success('Login successful')
        await navigate({ to: '/' })
      } catch (submitError) {
        toast.error(getErrorMessage(submitError))
      }
    }
  })

  const [captchaInfo, setCaptchaInfo] = useState<Api.CaptchaVo>({
    captchaEnabled: false,
    uuid: '',
    img: '',
    expiresAt: 0
  })

  const [isCaptchaExpired, setIsCaptchaExpired] = useState(false)

  useEffect(() => {
    const remaining = captchaInfo.expiresAt - Date.now()
    if (remaining <= 0) {
      setIsCaptchaExpired(true)
      return
    }
    setIsCaptchaExpired(false)

    const timer = setTimeout(() => setIsCaptchaExpired(true), remaining)
    return () => clearTimeout(timer)
  }, [captchaInfo.expiresAt])

  const loadCaptcha = useCallback(async () => {
    try {
      const captcha = await authApi.getCaptcha()
      if (captcha.captchaEnabled) {
        captcha.img = `data:image/png;base64,${captcha.img}`
      }
      setCaptchaInfo(captcha)
    } catch (error) {
      console.error(error)
    }
  }, [])

  const [tenantInfo, setTenantInfo] = useState<Api.TenantVo>({
    tenantEnabled: false,
    voList: []
  })

  const loadTenant = useCallback(async () => {
    const tenants = await authApi.getLoginTenants()
    setTenantInfo(tenants)
    if (tenants.tenantEnabled && tenants.voList.length > 0) {
      form.setFieldValue('tenantId', tenants.voList[0].tenantId)
    }
  }, [form])

  const tenantOptions = useMemo(
    () => tenantInfo.voList.map(item => ({ label: item.companyName, value: item.tenantId })),
    [tenantInfo]
  )

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([loadCaptcha(), loadTenant()])
    }
    fetchData()
  }, [loadCaptcha, loadTenant])

  return (
    <form
      id="login-form"
      className="p-6 md:p-8"
      onSubmit={event => {
        event.preventDefault()
        form.handleSubmit()
      }}
    >
      <FieldGroup>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Please login to your account to get started.
          </p>
        </div>

        {tenantInfo.tenantEnabled && (
          <form.Field
            name="tenantId"
            validators={{
              onBlur: loginSchema.shape.tenantId,
              onSubmit: loginSchema.shape.tenantId
            }}
          >
            {field => {
              const fieldError = getFieldError(field.state.meta.errors)
              return (
                <Field data-invalid={Boolean(fieldError)}>
                  <Select
                    value={field.state.value}
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
                  <FieldError>{fieldError}</FieldError>
                </Field>
              )
            }}
          </form.Field>
        )}

        <form.Field
          name="username"
          validators={{
            onBlur: loginSchema.shape.username,
            onSubmit: loginSchema.shape.username
          }}
        >
          {field => {
            const fieldError = getFieldError(field.state.meta.errors)
            return (
              <Field data-invalid={Boolean(fieldError)}>
                <Input
                  id="username"
                  autoComplete="username"
                  onBlur={field.handleBlur}
                  onChange={event => field.handleChange(event.target.value)}
                  placeholder="Enter your username"
                  value={field.state.value}
                  className="text-sm"
                />
                <FieldError>{fieldError}</FieldError>
              </Field>
            )
          }}
        </form.Field>
        <form.Field
          name="password"
          validators={{
            onBlur: loginSchema.shape.password,
            onSubmit: loginSchema.shape.password
          }}
        >
          {field => {
            const fieldError = getFieldError(field.state.meta.errors)
            return (
              <Field data-invalid={Boolean(fieldError)}>
                <div className="relative">
                  <Input
                    id="password"
                    autoComplete="current-password"
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
                <FieldError>{fieldError}</FieldError>
                <FieldDescription className="text-right">
                  <Link to="/" className="underline hover:cursor-pointer hover:text-foreground">
                    Forgot your password?
                  </Link>
                </FieldDescription>
              </Field>
            )
          }}
        </form.Field>

        {captchaInfo.captchaEnabled && (
          <form.Field
            name="captchaCode"
            validators={{
              onBlur: loginSchema.shape.captchaCode,
              onSubmit: loginSchema.shape.captchaCode
            }}
          >
            {field => {
              const fieldError = getFieldError(field.state.meta.errors)
              return (
                <Field data-invalid={Boolean(fieldError)}>
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
                      className="relative h-9 overflow-hidden rounded-lg border hover:cursor-pointer"
                      onClick={loadCaptcha}
                      type="button"
                    >
                      {captchaInfo.img && (
                        <img
                          alt="captcha"
                          className="size-full object-contain"
                          src={captchaInfo.img}
                        />
                      )}
                      {isCaptchaExpired && (
                        <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60 font-bold text-white backdrop-blur-sm">
                          Expired
                        </span>
                      )}
                    </button>
                  </div>
                  <FieldError>{fieldError}</FieldError>
                </Field>
              )
            }}
          </form.Field>
        )}

        <form.Subscribe selector={state => state.isSubmitting}>
          {isSubmitting => (
            <Field>
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? (
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
