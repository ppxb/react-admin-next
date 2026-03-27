import CryptoJS from 'crypto-js'
import JSEncrypt from 'jsencrypt'

export interface RequestEncryptionOptions {
  headerFlag: string
  publicKey: string
}

export interface EncryptedRequestPayload {
  encryptedBody: string
  encryptedKey: string
  headerFlag: string
}

function randomStr(length = 32) {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = ''

  for (let i = 0; i < length; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }

  return result
}

function encodeBase64(text: string) {
  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text))
}

function encryptByAes(payload: string, key: string) {
  const aesKey = CryptoJS.enc.Utf8.parse(key)
  const encrypted = CryptoJS.AES.encrypt(payload, aesKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  })

  return encrypted.toString()
}

function encryptByRsa(payload: string, publicKey: string) {
  const rsa = new JSEncrypt()
  rsa.setPublicKey(publicKey)
  const encrypted = rsa.encrypt(payload)

  if (!encrypted) {
    throw new Error('RSA encryption failed')
  }

  return encrypted
}

export function encryptRequestPayload(
  payload: string,
  options: RequestEncryptionOptions
): EncryptedRequestPayload {
  const aesPassword = randomStr(32)
  const encryptedBody = encryptByAes(payload, aesPassword)
  const encryptedKey = encryptByRsa(encodeBase64(aesPassword), options.publicKey)

  return {
    encryptedBody,
    encryptedKey,
    headerFlag: options.headerFlag
  }
}
