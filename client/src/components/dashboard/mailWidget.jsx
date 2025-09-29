import { useEffect, useState } from 'react'
import { ExternalLink, Mail } from 'lucide-react'
import './mailWidget.css'
import { useNavigate } from 'react-router-dom'
import useMailSettingsStore from '../../utils/mailSettingsStore'
import { listMail } from '../../utils/mailApi'

const MailWidget = () => {
  const navigate = useNavigate()
  const { login, encPass, tourDone, loadFromServer } = useMailSettingsStore()
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try { await loadFromServer() } catch (_) {}
      if (cancelled) return
      setReady(true)
    })()
    return () => { cancelled = true }
  }, [loadFromServer])

  useEffect(() => {
    let cancelled = false
    if (!ready) return
    if (!tourDone || !login || !encPass) { setLoading(false); return }
    ;(async () => {
      try {
        setLoading(true)
        setError('')
        const data = await listMail({ login, encPass, page: 1, pageSize: 8 })
        if (!cancelled) setItems(data?.items || [])
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.error || 'Erreur lors du chargement des mails')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [ready, tourDone, login, encPass])

  const openMail = (m) => {
    const params = new URLSearchParams()
    if (m?.uid) params.set('uid', String(m.uid))
    if (m?.seq) params.set('seq', String(m.seq))
    navigate(`/mail?${params.toString()}`)
  }

  return (
    <div className="ut-widget mail-widget">
      <div className="module-header">
        <h3>Mes mails récents</h3>
        <a className="see-all" href="/mail" onClick={(e) => { e.preventDefault(); navigate('/mail') }}>
          Ouvrir <ExternalLink size={14} />
        </a>
      </div>
      {!tourDone || !login || !encPass ? (
        <div className="mw-empty">
          <Mail size={32} />
          <p>Configurez votre messagerie pour voir vos mails.</p>
          <button className="mw-link" onClick={() => navigate('/mail')}>Configurer</button>
        </div>
      ) : loading ? (
        <div className="mw-loading">Chargement…</div>
      ) : error ? (
        <div className="mw-error">{String(error)}</div>
      ) : items.length === 0 ? (
        <div className="mw-empty">
          <Mail size={32} />
          <p>Aucun mail</p>
        </div>
      ) : (
        <ul className="mw-list">
          {items.map(m => (
            <li key={m.uid} className={`mw-item ${!m.seen ? 'unread' : ''}`} onClick={() => openMail(m)}>
              <div className="mw-top">
                <div className="mw-from" title={m.from}>
                  {!m.seen && <span className="mw-dot" aria-hidden />}
                  {m.from || '—'}
                </div>
                <div className="mw-date">{m.date ? new Date(m.date).toLocaleString('fr-FR') : ''}</div>
              </div>
              <div className="mw-subject" title={m.subject}>{m.subject || '(Sans objet)'}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default MailWidget
