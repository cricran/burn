import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// Persistent RSA keypair for cross-restart stability.
// Preference order: ENV-provided, then on-disk cache, else auto-generate and persist.

const KEYS_DIR = process.env.KEYS_DIR || path.join(process.cwd(), 'server_data')
const PRIV_PATH = process.env.MAIL_RSA_PRIVATE_PATH || path.join(KEYS_DIR, 'mail_private.pem')
const PUB_PATH = process.env.MAIL_RSA_PUBLIC_PATH || path.join(KEYS_DIR, 'mail_public.pem')

let cached = null

export function ensureKeys() {
  if (cached) return cached
  // 1) ENV-provided
  const envPriv = process.env.MAIL_RSA_PRIVATE
  const envPub = process.env.MAIL_RSA_PUBLIC
  if (envPriv && envPub) {
    cached = { privateKeyPem: envPriv, publicKeyPem: envPub }
    return cached
  }
  // 2) Disk
  try {
    if (fs.existsSync(PRIV_PATH) && fs.existsSync(PUB_PATH)) {
      const privateKeyPem = fs.readFileSync(PRIV_PATH, 'utf8')
      const publicKeyPem = fs.readFileSync(PUB_PATH, 'utf8')
      cached = { privateKeyPem, publicKeyPem }
      return cached
    }
  } catch (e) {
    // ignore and generate new
  }
  // 3) Generate
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  })
  // Persist
  try {
    if (!fs.existsSync(KEYS_DIR)) fs.mkdirSync(KEYS_DIR, { recursive: true })
    fs.writeFileSync(PRIV_PATH, privateKey, { mode: 0o600 })
    fs.writeFileSync(PUB_PATH, publicKey, { mode: 0o644 })
  } catch (e) {
    // If persisting fails, still return keys (ephemeral)
  }
  cached = { privateKeyPem: privateKey, publicKeyPem: publicKey }
  return cached
}

export function getPublicKeyPem() {
  return ensureKeys().publicKeyPem
}

export function decryptWithPrivateKey(base64Cipher) {
  const { privateKeyPem } = ensureKeys()
  const buffer = Buffer.from(base64Cipher, 'base64')
  try {
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      buffer
    )
    return decrypted.toString('utf8')
  } catch (e) {
    const alt = crypto.privateDecrypt(
      { key: privateKeyPem, padding: crypto.constants.RSA_PKCS1_PADDING },
      buffer
    )
    return alt.toString('utf8')
  }
}
