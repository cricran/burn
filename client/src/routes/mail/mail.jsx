import { useEffect, useMemo, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import './mail.css'
import useMailSettingsStore from '../../utils/mailSettingsStore'
import { rsaEncryptPassword, testMail, listMail, getMessage, deleteMessage, getSogoLink, markSeen } from '../../utils/mailApi'
import { openLayer, discard, closeTop } from '../../utils/uiHistory'
import useNotificationStore from '../../utils/notificationStore'

const Mail = () => {
  const { email, login, encPass, tourDone, loadFromServer, saveToServer, setLocal } = useMailSettingsStore()
  const notify = useNotificationStore(state => state.notify)
  const [ready, setReady] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [form, setForm] = useState({ email: '', login: '', password: '' })
  const [testing, setTesting] = useState(false)
  const [testError, setTestError] = useState('')
  const [sogo, setSogo] = useState('https://sogo.univ-rouen.fr/')

  // Mail list state
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [message, setMessage] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [query, setQuery] = useState('')
  const [unreadOnly, setUnreadOnly] = useState(false)

  // Mark initial enter for animations
  const [entered, setEntered] = useState(false)
  useEffect(() => { setEntered(true) }, [])

  // Handle deep-link open from query string (uid or seq)
  const [searchParams] = useSearchParams()
  const targetUid = searchParams.get('uid')
  const targetSeq = searchParams.get('seq')
  const openedFromParams = useRef(false)

  // Load server settings and decide if onboarding
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try { await loadFromServer() } catch (_) {}
      try { const u = await getSogoLink(); if (!cancelled) setSogo(u) } catch (_) {}
      const needs = !tourDone || !login || !encPass
      setShowOnboarding(needs)
      setReady(true)
    })()
    return () => { cancelled = true }
  }, [])

  const pageSize = 15

  const loadPage = async (targetPage) => {
    if (!login || !encPass) return
    setLoading(true)
    setError('')
    try {
      const data = await listMail({ login, encPass, page: targetPage, pageSize })
  const newItems = data.items || []
  setItems(prev => targetPage === 1 ? newItems : [...prev, ...newItems])
  const t = Number(data.total || 0)
  setTotal(t)
  setHasMore(targetPage * pageSize < t && newItems.length > 0)
      setPage(targetPage)
    } catch (e) {
      const status = e?.response?.status
      if (status === 401) {
        setError('Authentification IMAP échouée. Vérifiez votre login/mot de passe.')
      } else if (status === 502) {
        setError("Connexion au serveur IMAP impossible. Vérifiez votre réseau/TLS.")
      } else {
        setError(e?.response?.data?.error || 'Erreur lors du chargement des mails')
      }
  setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  // Infinite scroll
  const sentinelRef = useRef(null)
  useEffect(() => {
    if (!ready || showOnboarding) return
    // initial load
    loadPage(1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, showOnboarding, login, encPass])

  // After first page loads, if a target uid/seq is present, open it once.
  useEffect(() => {
    if (!ready || showOnboarding || openedFromParams.current) return
    const uidNum = targetUid ? Number(targetUid) : null
    const seqNum = targetSeq ? Number(targetSeq) : null
    if (!uidNum && !seqNum) return
    // If the item is in the current list we can pass seq; otherwise open by uid only
    const inList = items.find(m => (uidNum && m.uid === uidNum) || (seqNum && m.seq === seqNum))
    if (uidNum) {
      openMessage(uidNum, inList?.seq || undefined)
    } else if (seqNum) {
      openMessage(undefined, seqNum)
    }
    openedFromParams.current = true
    // run only when items change or params change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, ready, showOnboarding, targetUid, targetSeq])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    // Disable auto-load when filtering to avoid over-fetching while searching
    if (query.trim() || unreadOnly) return
    if (loading || !hasMore || error) return
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        io.disconnect()
        loadPage(page + 1)
      }
    }, { root: null, rootMargin: '200px', threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [sentinelRef, loading, hasMore, page, error, query, unreadOnly])

  const openMessage = async (uid, seq) => {
    setSelected(uid ?? seq ?? null)
    setMessage(null)
    try {
      const data = await getMessage({ login, encPass, uid, seq })
      setMessage(data)
      // If server resolved a real UID (e.g., opened by seq), update selection to UID for actions like delete
      if (data?.uid && data.uid !== uid) {
        setSelected(data.uid)
      }
      // mark as seen locally
      const seenUid = data?.uid || uid
      if (seenUid)
        setItems(prev => prev.map(m => m.uid === seenUid ? { ...m, seen: true } : m))
  // fire-and-forget server-side mark seen
  if (seenUid) markSeen({ login, encPass, uid: seenUid }).catch(() => {})
    } catch (e) {
      setMessage({ error: 'Impossible d\'ouvrir le message' })
    }
  }

  const deleteSelected = async () => {
    if (!selected) return
    setDeleting(true)
    try {
      await deleteMessage({ login, encPass, uid: selected })
      setItems(prev => prev.filter(x => x.uid !== selected))
      setSelected(null)
      setMessage(null)
  // Close mobile viewer layer if open
  if (isMobile) closeTop()
  // Success toast
  notify({ type: 'success', title: 'Mail supprimé', message: 'Le message a été supprimé avec succès.' })
    } catch (e) {
  notify({ type: 'error', title: 'Échec de la suppression', message: "Le message n'a pas pu être supprimé." })
    } finally {
      setDeleting(false)
    }
  }

  const submitOnboarding = async (e) => {
    e.preventDefault()
    setTesting(true)
    setTestError('')
    try {
      const enc = await rsaEncryptPassword(form.password)
      const t = await testMail({ login: form.login, encPass: enc })
      if (!t?.ok) { setTestError('Connexion IMAP échouée'); setTesting(false); return }
      await saveToServer({ email: form.email, login: form.login, tourDone: true })
      setLocal({ encPass: enc })
      setShowOnboarding(false)
    } catch (e2) {
      setTestError('Erreur lors du test de connexion')
    } finally {
      setTesting(false)
    }
  }

  const isMobile = useMemo(() => typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(max-width: 820px)').matches : false, [])

  // UI history for mobile mail view
  useEffect(() => {
    if (isMobile && selected) {
      const token = openLayer(() => {
        setSelected(null)
        setMessage(null)
      })
      return () => discard(token)
    }
  }, [isMobile, selected])

  const visibleItems = useMemo(() => {
    let list = items
    if (unreadOnly) list = list.filter(m => !m.seen)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(m => (m.subject || '').toLowerCase().includes(q) || (m.from || '').toLowerCase().includes(q))
    }
    return list
  }, [items, query, unreadOnly])

  const sanitizeEmailHtml = (html) => {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(String(html || ''), 'text/html')
      // Remove active content and any embedded/external stylesheets
      doc.querySelectorAll('script, iframe, object, embed, style, link').forEach(el => el.remove())

      // Scrub attributes on all nodes to avoid CSS/JS interference
      doc.querySelectorAll('*').forEach(el => {
        Array.from(el.attributes || []).forEach(attr => {
          const name = (attr.name || '').toLowerCase()
          const val = (attr.value || '').trim()

          // Remove inline event handlers and styles
          if (name.startsWith('on')) { el.removeAttribute(attr.name); return }
          if (name === 'style') { el.removeAttribute('style'); return }

          // Remove classes and ids to prevent collisions with app CSS
          if (name === 'class' || name === 'id') { el.removeAttribute(attr.name); return }

          // Disallow executable URLs
          if ((name === 'href' || name === 'src') && /^javascript:/i.test(val)) {
            el.removeAttribute(attr.name); return
          }
        })

        // Harden anchors: allow only http(s)/mailto/tel and enforce target+rel
        if (el.tagName === 'A') {
          const href = el.getAttribute('href') || ''
          const ok = /^(https?:|mailto:|tel:)/i.test(href)
          if (!ok) el.removeAttribute('href')
          // On mobile, open in the same window; on desktop, open in a new tab
          if (isMobile) {
            el.removeAttribute('target')
            // Keep nofollow to avoid SEO impact but noopener/noreferrer not needed with _self
            el.setAttribute('rel', 'nofollow')
          } else {
            el.setAttribute('target', '_blank')
            el.setAttribute('rel', 'noopener noreferrer nofollow')
          }
        }
      })
      return doc.body.innerHTML || ''
    } catch {
      return ''
    }
  }

  if (!ready) return null

  return (
    <div className={`content mail ${entered ? 'page-enter' : ''} ${isMobile && selected ? 'mobile-open' : ''}`}>
      <div className='dashboard-header'>
        <div className='dashboard-title'>
          <h1>Mes mails</h1>
          <p>Boîte INBOX</p>
        </div>
        <div className='ut-actions'>
          <button className='link-btn' onClick={() => loadPage(1)} title="Actualiser"><RefreshCw size={16} /></button>
          <a className='link-btn' href={sogo} target={isMobile ? undefined : '_blank'} rel={isMobile ? undefined : 'noreferrer noopener'}>Ouvrir SOGo</a>
        </div>
      </div>

      {showOnboarding ? (
        <div className='onboarding'>
          <div className='card'>
            <h2>Configurer votre messagerie</h2>
            <p>Entrez votre adresse mail universitaire, votre login Multipass et votre mot de passe. Le mot de passe est chiffré côté client et jamais stocké en clair.</p>
            <form onSubmit={submitOnboarding}>
              <label>Adresse mail universitaire
                <input required type='email' value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder='prenom.nom@univ-rouen.fr' />
              </label>
              <label>Login Multipass
                <input required value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} placeholder='votre login' />
              </label>
              <label>Mot de passe
                <input required type='password' value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </label>
              {testError && <div className='error'>{testError}</div>}
              <button className='primary' disabled={testing}>{testing ? 'Test…' : 'Tester et enregistrer'}</button>
            </form>
          </div>
        </div>
      ) : (
        <div className={`mail-wrapper ${isMobile && selected ? 'mobile-details-open' : ''}`}>
          <aside className='mail-list'>
            <div className='mail-list-header'>
              <input
                className='mail-search'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Rechercher expéditeur ou objet…'
              />
              <label className='mail-unread-toggle'>
                <input type='checkbox' checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />
                Non lus seulement
              </label>
            </div>
            <ul>
              {visibleItems.map(m => (
                <li key={m.uid} className={`${m.uid === selected ? 'active' : ''} ${!m.seen ? 'unread' : ''}`} onClick={() => openMessage(m.uid, m.seq)}>
                  <div className='row1'>
                    <div className='from' title={m.from}>
                      {!m.seen && <span className='unread-dot' aria-hidden />}
                      {m.from || '—'}
                    </div>
                    <div className='date'>{new Date(m.date).toLocaleString('fr-FR')}</div>
                  </div>
                  <div className='row2'>
                    <div className={`subject ${m.seen ? '' : 'unseen'}`}>{m.subject}</div>
                  </div>
                </li>
              ))}
            </ul>
            {error && <div className='error'>{error}</div>}
            {!query.trim() && !unreadOnly && (loading || hasMore) && (
              <div ref={sentinelRef} className='sentinel'>{loading ? 'Chargement…' : 'Charger plus'}</div>
            )}
            {(query.trim() || unreadOnly) && hasMore && !loading && (
              <div className='sentinel'>
                <button className='link-btn' onClick={() => loadPage(page + 1)}>Charger plus</button>
              </div>
            )}
          </aside>
          <main className={`mail-details ${selected ? 'has-selection' : ''} ${isMobile && selected ? 'mobile-open' : ''} ${!isMobile && selected ? 'desktop-fullscreen' : ''}`}>
            {isMobile && selected && (
              <div className='ut-mobile-bar'>
                <button className='ut-close' onClick={() => closeTop()}>✕</button>
              </div>
            )}
            {!selected && !isMobile && <div className='placeholder'>Sélectionnez un mail</div>}
            {selected && !message && <div className='loading'>Chargement…</div>}
            {selected && message && !message.error && (
              <div className='message'>
                <div className='toolbar'>
                  <button className='danger' disabled={deleting} onClick={deleteSelected}>{deleting ? 'Suppression…' : 'Supprimer'}</button>
                  <a className='link-btn' href={sogo} target={isMobile ? undefined : '_blank'} rel={isMobile ? undefined : 'noreferrer noopener'}>Ouvrir sur SOGo</a>
                </div>
                <h2 className='subject'>{message.subject}</h2>
                <div className='meta'>De: {message.from} · À: {message.to} · {message.date ? new Date(message.date).toLocaleString('fr-FR') : ''}</div>
                {message.html ? (
                  <div className='message-html' dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(message.html) }} />
                ) : (
                  <pre className='message-text'>{message.text || '—'}</pre>
                )}
              </div>
            )}
            {selected && message && message.error && <div className='error'>{message.error}</div>}
          </main>
        </div>
      )}
    </div>
  )
}

export default Mail
