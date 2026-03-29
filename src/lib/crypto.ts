import CryptoJS from 'crypto-js'
import JSEncrypt from 'jsencrypt'

const ENCRYPT_KEY_HEADER = 'encrypt-key'

export interface EncryptedPayload {
  body: string
  headers: Record<string, string>
}

function randomKey(length = 32) {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from(bytes, b => chars[b % chars.length]).join('')
}

function aesEncrypt(plain: string, key: string) {
  const encrypted = CryptoJS.AES.encrypt(plain, CryptoJS.enc.Utf8.parse(key), {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  })
  return encrypted.toString()
}

function rsaEncrypt(plain: string, publicKey: string) {
  const rsa = new JSEncrypt()
  rsa.setPublicKey(publicKey)
  const result = rsa.encrypt(plain)
  if (!result) {
    throw new Error('RSA encryption failed')
  }
  return result
}

export function encryptPayload(plain: string, publicKey: string): EncryptedPayload {
  const aesKey = randomKey(32)
  const encodedKey = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(aesKey))

  return {
    body: aesEncrypt(plain, aesKey),
    headers: { [ENCRYPT_KEY_HEADER]: rsaEncrypt(encodedKey, publicKey) }
  }
}
