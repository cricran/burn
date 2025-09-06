import apiRequest from './apiRequest'

let cachedPubKey = null

export async function getPublicKey() {
  if (cachedPubKey) return cachedPubKey
  const { data, headers } = await apiRequest.get('/mail/public-key', { responseType: 'text' })
  const pem = typeof data === 'string' ? data : headers?.['content-type']?.includes('text') ? data : ''
  cachedPubKey = pem
  return pem
}

export async function rsaEncryptPassword(plain) {
  // Use WebCrypto subtle with importKey SPKI if available
  const pem = await getPublicKey()
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')
  const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
  // Try SPKI
  const cryptoObj = window.crypto || window.msCrypto
  const subtle = cryptoObj.subtle
  const key = await subtle.importKey(
    'spki',
    raw.buffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256'
    },
    false,
    ['encrypt']
  )
  const enc = new TextEncoder()
  const cipher = await subtle.encrypt({ name: 'RSA-OAEP' }, key, enc.encode(plain))
  const out = btoa(String.fromCharCode(...new Uint8Array(cipher)))
  return out
}

export async function testMail({ login, encPass }) {
  const { data } = await apiRequest.post('/mail/test', { login, encPass })
  return data
}

export async function listMail({ login, encPass, mailbox = 'INBOX', page = 1, pageSize = 15 }) {
  const { data } = await apiRequest.post('/mail/list', { login, encPass, mailbox, page, pageSize })
  return data
}

export async function getMessage({ login, encPass, mailbox = 'INBOX', uid, seq }) {
  const { data } = await apiRequest.post('/mail/message', { login, encPass, mailbox, uid, seq })
  return data
}

export async function deleteMessage({ login, encPass, mailbox = 'INBOX', uid }) {
  const { data } = await apiRequest.post('/mail/delete', { login, encPass, mailbox, uid })
  return data
}

export async function getSogoLink() {
  const { data } = await apiRequest.get('/mail/sogo')
  return data?.url || 'https://sogo.univ-rouen.fr/'
}

export async function markSeen({ login, encPass, mailbox = 'INBOX', uid }) {
  const { data } = await apiRequest.post('/mail/seen', { login, encPass, mailbox, uid })
  return data
}
