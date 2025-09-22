import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import { getPublicKeyPem, decryptWithPrivateKey } from '../utils/keyStore.js'

const IMAP_HOST = process.env.IMAP_HOST || 'imap.univ-rouen.fr'
const IMAP_PORT = Number(process.env.IMAP_PORT || 993)
const IMAP_SECURE = true
const IMAP_TLS_REJECT_UNAUTHORIZED = process.env.IMAP_TLS_REJECT_UNAUTHORIZED !== 'false'
const LOG_IMAP = process.env.LOG_IMAP === 'true'

const SOGO_URL = process.env.SOGO_URL || 'https://sogo.univ-rouen.fr/'

function buildClient({ login, password }) {
  return new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: IMAP_SECURE,
  tls: { rejectUnauthorized: IMAP_TLS_REJECT_UNAUTHORIZED },
  auth: { user: login, pass: password },
    logger: LOG_IMAP ? (entry) => {
      try {
        const line = typeof entry === 'string' ? entry : JSON.stringify(entry)
        console.log('[IMAPFLOW]', line)
      } catch (_) {}
    } : false
  })
}

export async function getPublicKey(req, res) {
  try {
    const pub = getPublicKeyPem()
    res.status(200).send(pub)
  } catch (e) {
    res.status(500).json({ error: 'Failed to provide public key' })
  }
}

export async function testMail(req, res) {
  const { login, encPass } = req.body || {}
  if (!login || !encPass) return res.status(400).json({ ok: false, error: 'login and encPass required' })
  const password = decryptWithPrivateKey(String(encPass))
  const client = buildClient({ login, password })
  try {
    await client.connect()
    await client.logout()
    return res.status(200).json({ ok: true })
  } catch (e) {
    return res.status(200).json({ ok: false, error: 'IMAP auth failed' })
  }
}

export async function listMail(req, res) {
  const { login, encPass, mailbox = 'INBOX', page = 1, pageSize = 15 } = req.body || {}
  if (!login || !encPass) return res.status(400).json({ error: 'login and encPass required' })
  const size = Math.max(1, Math.min(100, Number(pageSize) || 15))
  const pageNum = Math.max(1, Number(page) || 1)
  let password
  try { password = decryptWithPrivateKey(String(encPass)) } catch (_) { return res.status(400).json({ error: 'Invalid encPass' }) }
  const client = buildClient({ login, password })
  try {
    await client.connect()
    await client.mailboxOpen(mailbox, { readOnly: true })
  // Optional: verify message exists
  // If needed, we could search by UID to ensure presence before download
  // const exists = await client.fetchOne(String(uid), { uid: true, uidValidity: true }).catch(() => null)
  // if (!exists) { await client.logout(); return res.status(404).json({ error: 'Message not found' }) }
  const total = client.mailbox.exists || 0
    // Fetch newest first: sequence numbers ascending correspond to oldest
    // We'll compute UID range by sequence-window from the end.
    const startSeq = Math.max(1, total - (pageNum * size) + 1)
    const endSeq = Math.max(1, total - ((pageNum - 1) * size))
    let messages = []
    if (total > 0 && startSeq <= endSeq) {
      // Debug: range being fetched
      console.log('[IMAP] list', { mailbox, total, startSeq, endSeq, page: pageNum, size })
      for await (let msg of client.fetch(`${startSeq}:${endSeq}`, { envelope: true, uid: true, flags: true, internalDate: true })) {
        messages.push(msg)
      }
      // sort desc by date or seq to ensure newest first
      messages.sort((a, b) => {
        const ad = a.internalDate ? new Date(a.internalDate).getTime() : 0
        const bd = b.internalDate ? new Date(b.internalDate).getTime() : 0
        if (ad !== bd) return bd - ad
        const as = Number(a.seq) || 0
        const bs = Number(b.seq) || 0
        return bs - as
      })
    }
  const items = messages.map(m => {
      const flags = m.flags || new Set()
      const seen = typeof flags.has === 'function'
        ? (flags.has('\\Seen') || flags.has('Seen'))
        : (Array.isArray(flags) ? (flags.includes('\\Seen') || flags.includes('Seen')) : false)
      return {
        uid: m.uid,
    seq: m.seq,
        subject: m.envelope?.subject || '(Sans objet)',
        from: (m.envelope?.from || []).map(x => x.address || x.name).filter(Boolean).join(', '),
        date: m.internalDate,
        seen
      }
    })
    await client.logout()
    return res.status(200).json({ total, page: pageNum, pageSize: size, items })
  } catch (e) {
    console.error('[IMAP] list error', e?.code, e?.message)
    const msg = String(e?.message || '')
    const code = String(e?.code || '')
    // Common auth failures
    if (/AUTH|Invalid credentials|LOGIN failed/i.test(msg) || /AUTHENTICATIONFAILED/i.test(code)) {
      try { await client.logout() } catch (_) {}
      return res.status(401).json({ error: 'IMAP auth failed' })
    }
    // Connection/TLS issues
    if (/ETIMEDOUT|ECONNREFUSED|ENOTFOUND|certificate/i.test(msg)) {
      try { await client.logout() } catch (_) {}
      return res.status(502).json({ error: 'IMAP connection failed', details: msg })
    }
    try { await client.logout() } catch (_) {}
    return res.status(500).json({ error: 'Failed to list mail', details: msg })
  }
}

export async function getMessage(req, res) {
  const { login, encPass, mailbox = 'INBOX', uid, seq } = req.body || {}
  if (!login || !encPass || (!uid && !seq)) return res.status(400).json({ error: 'login, encPass and uid or seq required' })
  const uidNum = uid ? Number(uid) : null
  const seqNum = seq ? Number(seq) : null
  if (uid != null && (!Number.isFinite(uidNum) || uidNum <= 0)) return res.status(400).json({ error: 'Invalid uid' })
  if (seq != null && (!Number.isFinite(seqNum) || seqNum <= 0)) return res.status(400).json({ error: 'Invalid seq' })
  let password
  try { password = decryptWithPrivateKey(String(encPass)) } catch (_) { return res.status(400).json({ error: 'Invalid encPass' }) }
  const client = buildClient({ login, password })
  try {
    await client.connect()
    await client.mailboxOpen(mailbox, { readOnly: true })
    console.log('[IMAP] getMessage start', { mailbox, uid: uidNum, seq: seqNum })
    let parsed
    let resolvedUid = uidNum || null
    let resolvedSeq = seqNum || null
    try {
      if (uidNum) {
        console.log('[IMAP] getMessage download(uid)', { uid: uidNum })
        const { content } = await client.download(uidNum, { uid: true })
        parsed = await simpleParser(content)
      } else {
        console.log('[IMAP] getMessage download(seq)', { seq: seqNum })
        const { content } = await client.download(seqNum)
        parsed = await simpleParser(content)
        // Try to resolve UID from seq
        try {
          const meta = await client.fetchOne(seqNum, { uid: true })
          if (meta?.uid) resolvedUid = Number(meta.uid)
        } catch (_) {}
      }
    } catch (e1) {
      console.error('[IMAP] getMessage download failed', e1?.code, e1?.message)
      // Fallback 1: fetchOne with source
      try {
        if (uidNum) {
          console.log('[IMAP] getMessage fetchOne(source)', { uid: uidNum })
          const msg = await client.fetchOne(uidNum, { uid: true, source: true })
          const raw = msg?.source
          if (!raw) throw new Error('Empty message source')
          parsed = await simpleParser(raw)
        } else {
          console.log('[IMAP] getMessage fetchOne(source) by seq', { seq: seqNum })
          const msg = await client.fetchOne(seqNum, { source: true, uid: true })
          const raw = msg?.source
          if (!raw) throw new Error('Empty message source')
          parsed = await simpleParser(raw)
          if (msg?.uid) resolvedUid = Number(msg.uid)
        }
      } catch (e2) {
        console.error('[IMAP] getMessage fetchOne failed', e2?.code, e2?.message)
        // Fallback 2: fetch iterator with source and take first
        try {
          console.log('[IMAP] getMessage fetch iterator(source)', { uid: uidNum, seq: seqNum })
          let got = null
          if (uidNum) {
            for await (let m of client.fetch(uidNum, { uid: true, source: true })) {
              if (m?.source) { got = m.source; break }
            }
          } else {
            for await (let m of client.fetch(seqNum, { source: true })) {
              if (m?.source) { got = m.source; break }
            }
          }
          if (!got) throw new Error('Message not found in iterator')
          parsed = await simpleParser(got)
        } catch (e3) {
          console.error('[IMAP] getMessage fetch iterator failed', e3?.code, e3?.message)
          // Fallback 3: search by UID then fetch
          try {
            console.log('[IMAP] getMessage UID search')
    const found = await client.search({ uid: `${uidNum || resolvedUid}:${uidNum || resolvedUid}` })
            if (!found || !found.length) throw new Error('UID not found in search')
            const msg = await client.fetchOne(found[0], { uid: true, source: true })
            const raw = msg?.source
            if (!raw) throw new Error('Empty message source after search')
            parsed = await simpleParser(raw)
    if (msg?.uid) resolvedUid = Number(msg.uid)
          } catch (e4) {
            console.error('[IMAP] getMessage search+fetch failed', e4?.code, e4?.message)
            throw e1 || e2 || e3 || e4
          }
        }
      }
    }
    await client.logout()
    return res.status(200).json({
  uid: resolvedUid || uidNum || null,
  seq: resolvedSeq || null,
      subject: parsed.subject || '(Sans objet)',
      from: parsed.from?.text || '',
      to: parsed.to?.text || '',
      date: parsed.date || null,
      html: parsed.html || null,
      text: parsed.text || null
    })
  } catch (e) {
    console.error('[IMAP] getMessage error', e?.code, e?.message)
    const msg = String(e?.message || '')
    const code = String(e?.code || '')
    if (/not found|No matching messages/i.test(msg)) {
      try { await client.logout() } catch (_) {}
      return res.status(404).json({ error: 'Message not found' })
    }
    if (/AUTH|Invalid credentials|LOGIN failed/i.test(msg) || /AUTHENTICATIONFAILED/i.test(code)) {
      try { await client.logout() } catch (_) {}
      return res.status(401).json({ error: 'IMAP auth failed' })
    }
    if (/ETIMEDOUT|ECONNREFUSED|ENOTFOUND|certificate/i.test(msg)) {
      try { await client.logout() } catch (_) {}
      return res.status(502).json({ error: 'IMAP connection failed', details: msg })
    }
    try { await client.logout() } catch (_) {}
    return res.status(500).json({ error: 'Failed to fetch message', details: msg })
  }
}

export async function deleteMessage(req, res) {
  const { login, encPass, mailbox = 'INBOX', uid, seq } = req.body || {}
  if (!login || !encPass || (!uid && !seq)) return res.status(400).json({ error: 'login, encPass and uid or seq required' })
  let password
  try { password = decryptWithPrivateKey(String(encPass)) } catch (_) { return res.status(400).json({ error: 'Invalid encPass' }) }
  const client = buildClient({ login, password })
  try {
    await client.connect()
    await client.mailboxOpen(mailbox, { readOnly: false })
    // Delete using ImapFlow API (handles flag+expunge internally per implementation)
    if (uid) {
      await client.messageDelete(uid, { uid: true })
    } else {
      await client.messageDelete(seq)
    }
    await client.logout()
    return res.status(200).json({ ok: true })
  } catch (e) {
    try { await client.logout() } catch (_) {}
    const msg = String(e?.message || '')
    const code = String(e?.code || '')
    console.error('[IMAP] deleteMessage error', { mailbox, uid, seq, code, msg })
    if (/AUTH|Invalid credentials|LOGIN failed/i.test(msg) || /AUTHENTICATIONFAILED/i.test(code)) {
      return res.status(401).json({ error: 'IMAP auth failed' })
    }
    if (/ETIMEDOUT|ECONNREFUSED|ENOTFOUND|certificate/i.test(msg)) {
      return res.status(502).json({ error: 'IMAP connection failed', details: msg })
    }
    if (/No matching messages|not found|does not exist/i.test(msg)) {
      return res.status(404).json({ error: 'Message not found' })
    }
    return res.status(500).json({ error: 'Failed to delete message', details: msg })
  }
}

export async function getSogoLink(req, res) {
  return res.status(200).json({ url: SOGO_URL })
}

export async function markSeen(req, res) {
  const { login, encPass, mailbox = 'INBOX', uid } = req.body || {}
  if (!login || !encPass || !uid) return res.status(400).json({ error: 'login, encPass and uid required' })
  let password
  try { password = decryptWithPrivateKey(String(encPass)) } catch (_) { return res.status(400).json({ error: 'Invalid encPass' }) }
  const client = buildClient({ login, password })
  try {
    await client.connect()
    await client.mailboxOpen(mailbox, { readOnly: false })
    await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true })
    await client.logout()
    return res.status(200).json({ ok: true })
  } catch (e) {
    try { await client.logout() } catch (_) {}
    const msg = String(e?.message || '')
    const code = String(e?.code || '')
    if (/AUTH|Invalid credentials|LOGIN failed/i.test(msg) || /AUTHENTICATIONFAILED/i.test(code)) {
      return res.status(401).json({ error: 'IMAP auth failed' })
    }
    if (/ETIMEDOUT|ECONNREFUSED|ENOTFOUND|certificate/i.test(msg)) {
      return res.status(502).json({ error: 'IMAP connection failed', details: msg })
    }
    return res.status(500).json({ error: 'Failed to mark seen', details: msg })
  }
}
