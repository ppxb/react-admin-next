import { encryptRequestPayload, type RequestEncryptionOptions } from '@/lib/request-crypto'

type Primitive = boolean | number | string

type QueryValue = null | Primitive | readonly Primitive[] | undefined

export type QueryParams = Record<string, QueryValue>

export type ResponseParser = 'arrayBuffer' | 'auto' | 'blob' | 'json' | 'raw' | 'text'

export interface HttpRequestOptions<TBody = unknown> extends Omit<RequestInit, 'body' | 'headers'> {
  body?: TBody
  encrypt?: boolean
  headers?: HeadersInit
  params?: QueryParams
  parseAs?: ResponseParser
  skipErrorHandler?: boolean
  timeoutMs?: number
  withAuth?: boolean
  withClientId?: boolean
}

export interface HttpErrorContext {
  endpoint: string
  options: HttpRequestOptions<unknown>
}

export type HttpErrorHandler = (error: HttpError, context: HttpErrorContext) => void

export interface HttpEncryptionConfig extends RequestEncryptionOptions {
  enabled?: boolean
}

export interface HttpClientConfig {
  baseURL?: string
  defaultHeaders?: HeadersInit
  defaultTimeoutMs?: number
  encryption?: HttpEncryptionConfig
  getClientId?: () => null | string
  getToken?: () => null | string
  onError?: HttpErrorHandler
}

interface ErrorPayload<TData = unknown> {
  code?: number
  data?: TData
  message: string
  response?: Response
  status: number
}

export class HttpError<TData = unknown> extends Error {
  readonly code?: number
  readonly data?: TData
  readonly response?: Response
  readonly status: number

  constructor(payload: ErrorPayload<TData>) {
    super(payload.message)
    this.name = 'HttpError'
    this.status = payload.status
    this.code = payload.code
    this.data = payload.data
    this.response = payload.response
  }
}

let businessErrorHandler: HttpErrorHandler | null = null

export function setBusinessErrorHandler(handler: HttpErrorHandler | null) {
  businessErrorHandler = handler
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function isBinaryBody(value: unknown): value is ArrayBuffer | Blob | FormData | URLSearchParams {
  return (
    value instanceof FormData ||
    value instanceof URLSearchParams ||
    value instanceof Blob ||
    value instanceof ArrayBuffer
  )
}

function buildURL(baseURL: string, endpoint: string, params?: QueryParams): string {
  const normalizedBaseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const url = new URL(`${normalizedBaseURL}${normalizedEndpoint}`, window.location.origin)

  if (!params) {
    return url.toString()
  }

  for (const [key, rawValue] of Object.entries(params)) {
    if (rawValue === null || rawValue === undefined) {
      continue
    }

    if (Array.isArray(rawValue)) {
      for (const item of rawValue) {
        url.searchParams.append(key, String(item))
      }
      continue
    }

    url.searchParams.append(key, String(rawValue))
  }

  return url.toString()
}

async function tryParseJson(text: string): Promise<unknown> {
  if (!text.trim()) {
    return undefined
  }
  return JSON.parse(text)
}

function resolveToken(token: string): string {
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`
}

export class HttpClient {
  private readonly baseURL: string
  private readonly defaultHeaders: Headers
  private readonly defaultTimeoutMs: number
  private readonly encryption?: RequestEncryptionOptions
  private readonly getClientId?: () => null | string
  private readonly getToken?: () => null | string
  private readonly onError?: HttpErrorHandler

  constructor(config: HttpClientConfig = {}) {
    this.baseURL = config.baseURL ?? '/api'
    this.defaultHeaders = new Headers({
      Accept: 'application/json',
      ...config.defaultHeaders
    })
    this.defaultTimeoutMs = config.defaultTimeoutMs ?? 15_000
    this.encryption =
      config.encryption?.enabled !== false && config.encryption?.publicKey
        ? {
            headerFlag: config.encryption.headerFlag,
            publicKey: config.encryption.publicKey
          }
        : undefined
    this.getClientId = config.getClientId
    this.getToken = config.getToken
    this.onError = config.onError
  }

  async request<TResponse = unknown, TBody = unknown>(
    endpoint: string,
    options: HttpRequestOptions<TBody> = {}
  ): Promise<TResponse> {
    const {
      body,
      encrypt = false,
      headers,
      params,
      parseAs = 'auto',
      skipErrorHandler = false,
      timeoutMs = this.defaultTimeoutMs,
      withAuth = true,
      withClientId = true,
      signal,
      ...rest
    } = options

    const url = buildURL(this.baseURL, endpoint, params)
    const mergedHeaders = new Headers(this.defaultHeaders)

    if (headers) {
      const inputHeaders = new Headers(headers)
      inputHeaders.forEach((value, key) => mergedHeaders.set(key, value))
    }

    if (withAuth) {
      const token = this.getToken?.()
      if (token && !mergedHeaders.has('Authorization')) {
        mergedHeaders.set('Authorization', resolveToken(token))
      }
    }

    if (withClientId) {
      const clientId = this.getClientId?.()
      if (clientId && !mergedHeaders.has('clientid')) {
        mergedHeaders.set('clientid', clientId)
      }
    }

    let requestBody: BodyInit | null | undefined
    const requestMethod = (rest.method ?? 'GET').toUpperCase()
    const shouldEncryptBody =
      encrypt && Boolean(this.encryption) && (requestMethod === 'POST' || requestMethod === 'PUT')

    if (shouldEncryptBody && body !== undefined && body !== null) {
      if (isBinaryBody(body)) {
        throw new HttpError({
          message: 'Binary request body does not support request encryption',
          status: 0
        })
      }

      const plainPayload = typeof body === 'string' ? body : JSON.stringify(body)
      const encryptedPayload = encryptRequestPayload(plainPayload, this.encryption!)
      mergedHeaders.set(encryptedPayload.headerFlag, encryptedPayload.encryptedKey)
      mergedHeaders.set('Content-Type', 'text/plain;charset=UTF-8')
      requestBody = encryptedPayload.encryptedBody
    } else if (body !== undefined && body !== null) {
      if (isBinaryBody(body)) {
        requestBody = body
        if (body instanceof FormData) {
          mergedHeaders.delete('Content-Type')
        }
      } else if (typeof body === 'string') {
        requestBody = body
        if (!mergedHeaders.has('Content-Type')) {
          mergedHeaders.set('Content-Type', 'text/plain;charset=UTF-8')
        }
      } else {
        requestBody = JSON.stringify(body)
        if (!mergedHeaders.has('Content-Type')) {
          mergedHeaders.set('Content-Type', 'application/json')
        }
      }
    }

    const controller = new AbortController()
    const cleanup: Array<() => void> = []

    if (signal) {
      if (signal.aborted) {
        controller.abort(signal.reason)
      } else {
        const onAbort = () => controller.abort(signal.reason)
        signal.addEventListener('abort', onAbort, { once: true })
        cleanup.push(() => signal.removeEventListener('abort', onAbort))
      }
    }

    const timer = setTimeout(() => {
      controller.abort(new DOMException('Request timed out', 'AbortError'))
    }, timeoutMs)
    cleanup.push(() => clearTimeout(timer))

    const context: HttpErrorContext = {
      endpoint,
      options: options as HttpRequestOptions<unknown>
    }

    try {
      const response = await fetch(url, {
        ...rest,
        body: requestBody,
        headers: mergedHeaders,
        signal: controller.signal
      })

      if (!response.ok) {
        throw await this.toHttpError(response)
      }

      return (await this.parseResponse<TResponse>(response, parseAs)) as TResponse
    } catch (error) {
      const normalizedError = this.normalizeUnknownError(error)
      if (!skipErrorHandler) {
        this.onError?.(normalizedError, context)
      }
      throw normalizedError
    } finally {
      for (const dispose of cleanup) {
        dispose()
      }
    }
  }

  get<TResponse = unknown>(
    endpoint: string,
    options: Omit<HttpRequestOptions, 'body' | 'method'> = {}
  ) {
    return this.request<TResponse>(endpoint, { ...options, method: 'GET' })
  }

  delete<TResponse = unknown>(
    endpoint: string,
    options: Omit<HttpRequestOptions, 'body' | 'method'> = {}
  ) {
    return this.request<TResponse>(endpoint, { ...options, method: 'DELETE' })
  }

  post<TResponse = unknown, TBody = unknown>(
    endpoint: string,
    body?: TBody,
    options: Omit<HttpRequestOptions<TBody>, 'body' | 'method'> = {}
  ) {
    return this.request<TResponse, TBody>(endpoint, { ...options, body, method: 'POST' })
  }

  put<TResponse = unknown, TBody = unknown>(
    endpoint: string,
    body?: TBody,
    options: Omit<HttpRequestOptions<TBody>, 'body' | 'method'> = {}
  ) {
    return this.request<TResponse, TBody>(endpoint, { ...options, body, method: 'PUT' })
  }

  patch<TResponse = unknown, TBody = unknown>(
    endpoint: string,
    body?: TBody,
    options: Omit<HttpRequestOptions<TBody>, 'body' | 'method'> = {}
  ) {
    return this.request<TResponse, TBody>(endpoint, { ...options, body, method: 'PATCH' })
  }

  upload<TResponse = unknown>(
    endpoint: string,
    file: Blob | File,
    fieldName = 'file',
    options: Omit<HttpRequestOptions<FormData>, 'body' | 'method'> = {}
  ) {
    const formData = new FormData()
    formData.append(fieldName, file)
    return this.request<TResponse, FormData>(endpoint, {
      ...options,
      body: formData,
      method: 'POST'
    })
  }

  private normalizeUnknownError(error: unknown): HttpError {
    if (error instanceof HttpError) {
      return error
    }

    if (isAbortError(error)) {
      return new HttpError({
        message: 'Request aborted',
        status: 0
      })
    }

    return new HttpError({
      message: error instanceof Error ? error.message : 'Network request failed',
      status: 0
    })
  }

  private async parseResponse<TResponse>(
    response: Response,
    parseAs: ResponseParser
  ): Promise<TResponse | undefined> {
    if (
      response.status === 204 ||
      response.status === 205 ||
      response.headers.get('content-length') === '0'
    ) {
      return undefined
    }

    if (parseAs === 'raw') {
      return response as TResponse
    }

    if (parseAs === 'json') {
      const text = await response.text()
      return (await tryParseJson(text)) as TResponse
    }

    if (parseAs === 'text') {
      return (await response.text()) as TResponse
    }

    if (parseAs === 'blob') {
      return (await response.blob()) as TResponse
    }

    if (parseAs === 'arrayBuffer') {
      return (await response.arrayBuffer()) as TResponse
    }

    const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
    if (contentType.includes('application/json')) {
      const text = await response.text()
      return (await tryParseJson(text)) as TResponse
    }

    if (contentType.startsWith('text/')) {
      return (await response.text()) as TResponse
    }

    return (await response.blob()) as TResponse
  }

  private async toHttpError(response: Response): Promise<HttpError> {
    const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
    let errorData: unknown
    let message = `HTTP ${response.status}`
    let code: number | undefined

    try {
      if (contentType.includes('application/json')) {
        const text = await response.text()
        errorData = await tryParseJson(text)
        if (errorData && typeof errorData === 'object') {
          const typedError = errorData as Record<string, unknown>
          if (typeof typedError.message === 'string' && typedError.message) {
            message = typedError.message
          } else if (typeof typedError.msg === 'string' && typedError.msg) {
            message = typedError.msg
          }
          if (typeof typedError.code === 'number') {
            code = typedError.code
          }
        }
      } else {
        const text = await response.text()
        errorData = text
        if (text) {
          message = text
        }
      }
    } catch {
      message = response.statusText || message
    }

    if (message === `HTTP ${response.status}` && response.statusText) {
      message = response.statusText
    }

    return new HttpError({
      code,
      data: errorData,
      message,
      response,
      status: response.status
    })
  }
}

export interface UnwrapApiResponseOptions {
  skipErrorHandler?: boolean
}

export function unwrapApiResponse<T>(payload: Api.R<T>, options: UnwrapApiResponseOptions = {}): T {
  if (payload.code !== 200) {
    const error = new HttpError({
      code: payload.code,
      data: payload.data,
      message: payload.msg || `Business error: ${payload.code}`,
      status: 200
    })

    if (!options.skipErrorHandler) {
      businessErrorHandler?.(error, {
        endpoint: 'business-response',
        options: {}
      })
    }

    throw error
  }
  return payload.data
}

export function getErrorMessage(error: unknown) {
  if (error instanceof HttpError || error instanceof Error) {
    return error.message
  }
  return '服务端错误，请稍候再试'
}

export const http = new HttpClient()
