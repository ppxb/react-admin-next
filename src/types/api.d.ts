declare namespace Api {
  type GrantType = 'password' | 'sms' | 'email' | 'social' | 'xcx' | (string & {})

  interface R<T = unknown> {
    code: number
    msg: string
    data: T
  }

  interface LoginBody {
    clientId: string
    grantType: GrantType
    tenantId?: string
    code?: string
    uuid?: string
  }

  interface PasswordLoginBody extends LoginBody {
    username: string
    password: string
  }

  interface LoginVo {
    access_token: string
    refresh_token?: string
    expire_in: number
    refresh_expire_in?: number
    client_id: string
    scope?: string
    openid?: string
  }

  interface CaptchaVo {
    captchaEnabled: boolean
    uuid?: string
    img?: string
  }

  interface TenantListVo {
    tenantId: string
    companyName: string
    domain?: string
  }

  interface LoginTenantVo {
    tenantEnabled: boolean
    voList: TenantListVo[]
  }

  interface SysUserLite {
    userId: number
    userName: string
    nickName: string
    avatar?: null | number | string
    email?: string
    phonenumber?: string
    status?: string
    tenantId?: string
  }

  interface UserInfoVo {
    user: SysUserLite
    permissions: string[]
    roles: string[]
  }

  type AuthLoginResponse = R<LoginVo>
  type CaptchaResponse = R<CaptchaVo>
  type TenantListResponse = R<LoginTenantVo>
  type UserInfoResponse = R<UserInfoVo>
  type VoidResponse = R<void>
}
