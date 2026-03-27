import { DEFAULT_CLIENT_ID, apiClient } from '@/api/client'
import { unwrapApiResponse } from '@/lib/http'

export interface PasswordLoginParams {
  code?: string
  tenantId?: string
  username: string
  password: string
  uuid?: string
}

export async function getCaptcha() {
  const response = await apiClient.get<Api.CaptchaResponse>('/auth/code', {
    withAuth: false,
    skipErrorHandler: true
  })
  return unwrapApiResponse(response, { skipErrorHandler: true })
}

export async function getLoginTenants() {
  const response = await apiClient.get<Api.TenantListResponse>('/auth/tenant/list', {
    withAuth: false,
    skipErrorHandler: true
  })
  return unwrapApiResponse(response, { skipErrorHandler: true })
}

export async function loginWithPassword(params: PasswordLoginParams) {
  const payload: Api.PasswordLoginBody = {
    clientId: DEFAULT_CLIENT_ID,
    grantType: 'password',
    tenantId: params.tenantId,
    code: params.code,
    uuid: params.uuid,
    username: params.username,
    password: params.password
  }

  const response = await apiClient.post<Api.AuthLoginResponse, Api.PasswordLoginBody>(
    '/auth/login',
    payload,
    {
      encrypt: true,
      withAuth: false,
      skipErrorHandler: true
    }
  )
  return unwrapApiResponse(response, { skipErrorHandler: true })
}

export async function getUserInfo() {
  const response = await apiClient.get<Api.UserInfoResponse>('/system/user/getInfo')
  return unwrapApiResponse(response)
}

export async function logout() {
  const response = await apiClient.post<Api.VoidResponse>('/auth/logout')
  return unwrapApiResponse(response)
}
