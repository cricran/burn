import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PanelBottomClose, PanelLeftOpen, FileText, BookOpen, Link, File, Video, Image, Archive, HelpCircle, Upload, Download, EyeOff, Eye, Lock } from 'lucide-react'
import apiRequest from '../../utils/apiRequest'
import './universitice.css'
import useHiddenCoursesStore from '../../utils/hiddenCoursesStore'
import { openLayer, discard, closeTop } from '../../utils/uiHistory'

const Skeleton = ({ lines = 3 }) => (
  <div className="skel">
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="skel-line" />
    ))}
  </div>
)

const UniversiTice = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { hiddenCourses, loadHiddenCourses, hideCourse, unhideCourse, showHidden, setShowHidden } = useHiddenCoursesStore()
  const [courses, setCourses] = useState([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [content, setContent] = useState(null)
  const [contentLoading, setContentLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(max-width: 820px)').matches : false)
  const [openSections, setOpenSections] = useState(new Set())
  const storageKey = (courseId) => `ut:sections:${courseId}`

  // Simple in-memory cache per session to avoid re-fetching
  const contentsCache = useMemo(() => new Map(), [])

  // Build 1-2 letters initials for placeholders
  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'UT'
    const words = name.trim().split(/\s+/).filter(Boolean)
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
    return (words[0][0] + words[1][0]).toUpperCase()
  }

  // Charger l'état ouvert/fermé depuis le stockage local pour le cours sélectionné
  useEffect(() => {
    if (!selectedId || !content) return
    try {
      const raw = localStorage.getItem(storageKey(selectedId))
      if (raw) {
        const arr = JSON.parse(raw)
        const asSet = new Set(Array.isArray(arr) ? arr : [])
        setOpenSections(asSet)
      } else {
        // Par défaut: toutes les sections repliées (ne rien ouvrir)
        setOpenSections(new Set())
      }
    } catch {
      setOpenSections(new Set())
    }
  }, [selectedId, content])

  // Persister l'état à chaque bascule
  useEffect(() => {
    if (!selectedId || !content) return
    try {
      const arr = Array.from(openSections)
      localStorage.setItem(storageKey(selectedId), JSON.stringify(arr))
    } catch {}
  }, [openSections, selectedId, content])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setCoursesLoading(true)
      setError(null)
      try {
        // Ensure hidden courses are loaded so we can show flags if needed
        if (!hiddenCourses.length) { loadHiddenCourses().catch(() => {}) }
        const res = await apiRequest.get('/user/moodle/courses', { params: { showHidden } })
        setCourses(res.data?.courses || [])
        // Ne pas sélectionner par défaut
      } catch (e) {
        if (e?.response?.status === 401) {
          // invalid token -> redirect to auth
          const current = window.location.pathname
          window.location.replace(`/auth?redirect=${encodeURIComponent(current)}`)
          return
        }
        setError(e?.response?.data?.error || 'Erreur lors du chargement des cours')
      } finally {
        if (!cancelled) setCoursesLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [showHidden])

  // Read ?course=<id> from URL and preselect
  useEffect(() => {
    const cid = Number(searchParams.get('course'))
    if (cid && !Number.isNaN(cid)) {
      setSelectedId(cid)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reflect selection in URL for shareability
  useEffect(() => {
    const current = Number(searchParams.get('course')) || null
    if (selectedId && current !== Number(selectedId)) {
      const next = new URLSearchParams(searchParams)
      next.set('course', String(selectedId))
      setSearchParams(next, { replace: true })
    }
    if (!selectedId && current) {
      const next = new URLSearchParams(searchParams)
      next.delete('course')
      setSearchParams(next, { replace: true })
    }
  }, [selectedId, searchParams, setSearchParams])

  // Track mobile breakpoint to control overlay behavior
  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia('(max-width: 820px)')
    const onChange = (e) => setIsMobile(e.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  // UI history for mobile course view
  useEffect(() => {
    if (isMobile && selectedId) {
      const token = openLayer(() => {
        setSelectedId(null)
      })
      return () => discard(token)
    }
  }, [isMobile, selectedId])

  useEffect(() => {
    let cancelled = false
    const loadContent = async () => {
      if (!selectedId) return
      // Cache hit
      if (contentsCache.has(selectedId)) {
        setContent(contentsCache.get(selectedId))
        return
      }
      setContent(null)
      setContentLoading(true)
      setError(null)
      try {
        const res = await apiRequest.get(`/user/moodle/courses/${selectedId}`)
        const data = res.data?.contents || []
        contentsCache.set(selectedId, data)
        if (!cancelled) setContent(data)
      } catch (e) {
        if (e?.response?.status === 401) {
          const current = window.location.pathname
          window.location.replace(`/auth?redirect=${encodeURIComponent(current)}`)
          return
        }
        setError(e?.response?.data?.error || 'Erreur lors du chargement du cours')
      } finally {
        if (!cancelled) setContentLoading(false)
      }
    }
    loadContent()
    return () => { cancelled = true }
  }, [selectedId])

  const openOnUniversiTice = (courseUrl) => {
    if (isMobile) {
      window.location.assign(courseUrl)
    } else {
      window.open(courseUrl, '_blank', 'noopener,noreferrer')
    }
  }

  // Normalize anchor targets inside HTML fragments depending on device
  const adjustHtmlLinks = (html) => {
    try {
      const p = new DOMParser()
      const doc = p.parseFromString(String(html || ''), 'text/html')
      doc.querySelectorAll('a').forEach(a => {
        const href = a.getAttribute('href') || ''
        if (!/^(https?:|mailto:|tel:)/i.test(href)) return
        if (isMobile) {
          a.removeAttribute('target')
          a.removeAttribute('rel')
        } else {
          a.setAttribute('target', '_blank')
          a.setAttribute('rel', 'noopener noreferrer')
        }
      })
      return doc.body.innerHTML || ''
    } catch {
      return String(html || '')
    }
  }

  const handleSectionClick = (section) => {
    // Cliquer sur le titre doit ouvrir/fermer la section
    toggleSection(section.id)
  }

  const toggleSection = (sectionId) => {
    setOpenSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const getModuleIcon = (modname) => {
    switch (modname) {
      case 'resource':
      case 'folder':
        return <File size={16} />
      case 'url':
        return <Link size={16} />
      case 'page':
        return <FileText size={16} />
      case 'book':
        return <BookOpen size={16} />
      case 'video':
      case 'videofile':
        return <Video size={16} />
      case 'image':
      case 'imscp':
        return <Image size={16} />
      case 'quiz':
        return <HelpCircle size={16} />
      case 'assignment':
      case 'assign':
        return <Upload size={16} />
      default:
        return <File size={16} />
    }
  }

  // Mark initial enter for animations
  const [entered, setEntered] = useState(false)
  useEffect(() => { setEntered(true) }, [])

  // Assignment modal state
  const [modal, setModal] = useState({ open: false, courseId: null, module: null })
  const [files, setFiles] = useState([])
  const [assignStatusLoading, setAssignStatusLoading] = useState(false)
  const [statusNote, setStatusNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorNote, setErrorNote] = useState('')

  const openSubmitModal = async (courseId, module) => {
    setModal({ open: true, courseId, module })
    setFiles([])
    setStatusNote('')
  setErrorNote('')
    await fetchAssignStatusIfPossible(module)
  }

  const fetchAssignStatusIfPossible = async (module) => {
    try {
      setAssignStatusLoading(true)
      const courseId = selectedId
      if (!courseId) return
  const { data } = await apiRequest.get(`/assignments/course/${courseId}`)
  const list = data?.assignments || []
      const candidates = [module.instance, module.id, module.cmid].map(x => Number(x)).filter(Boolean)
      const match = list.find(a => candidates.includes(Number(a.cmid)))
      const chosen = match || list.find(a => (module.name || '').trim() === (a.name || '').trim())
      if (!chosen) { setStatusNote('Aucun devoir détecté'); return }
      const statusRes = await apiRequest.get(`/assignments/${chosen.id}/status`)
      const s = statusRes.data?.status
      if (!s) return
      const attemptNo = s?.lastattempt?.attemptnumber != null ? (Number(s.lastattempt.attemptnumber) + 1) : 1
      const submitted = s?.lastattempt?.submission?.status === 'submitted'
      const locked = s?.lastattempt?.canedit === false
      const graded = s?.gradingsummary?.gradedcount > 0
  const du = s?.lastattempt?.extensionduedate || s?.lastattempt?.duedate || s?.assignment?.duedate || s?.gradingsummary?.duedate || chosen?.duedate
  const openFrom = s?.lastattempt?.allowsubmissionsfromdate || s?.assignment?.allowsubmissionsfromdate || chosen?.allowsubmissionsfromdate
  const cutoff = s?.assignment?.cutoffdate || chosen?.cutoffdate || s?.lastattempt?.cutoffdate
      const fmt = (ts) => ts ? new Date(ts*1000).toLocaleString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
      const details = {
        title: module?.name || 'Devoir',
        openLabel: openFrom ? `Ouverture : ${fmt(openFrom)}` : undefined,
        dueLabel: du ? `Échéance : ${fmt(du)}` : undefined,
        closeLabel: cutoff ? `Fermeture : ${fmt(cutoff)}` : undefined,
        attempt: `Ceci est la tentative ${attemptNo}.`,
        work: submitted ? 'Travaux remis' : 'Aucun devoir n’a encore été remis',
        grading: graded ? 'Évalué' : 'Non évalué',
        canEdit: !locked,
        locked
      }
      setAssignDetails(details)
      setStatusNote(submitted ? 'Déjà soumis' : locked ? '' : 'Brouillon possible')
      setModal(prev => ({ ...prev, assignId: chosen.id }))
    } catch (e) {
      setAssignDetails(null)
    } finally {
      setAssignStatusLoading(false)
    }
  }

  const [assignDetails, setAssignDetails] = useState(null)

  // Support Bootstrap-like collapse toggles embedded in Moodle HTML descriptions
  const courseRef = useRef(null)
  useEffect(() => {
    const root = courseRef.current
    if (!root) return

    const esc = (s) => {
      if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(s)
      return String(s).replace(/[^a-zA-Z0-9_-]/g, '\\$&')
    }

    const initStates = () => {
      const anchors = root.querySelectorAll('a.icons-collapse-expand[href^="#"], a[data-toggle="collapse"][href^="#"]')
      anchors.forEach((a) => {
        const targetSel = a.getAttribute('href') || a.dataset.target
        if (!targetSel) return
        const id = targetSel.startsWith('#') ? targetSel.slice(1) : targetSel
        const panel = root.querySelector(`#${esc(id)}`)
        if (!panel) return
        // Trust the actual panel state first; fallback to anchor class if needed
        let expanded = panel.classList.contains('show')
        if (!expanded && !panel.classList.contains('show')) {
          expanded = !a.classList.contains('collapsed')
        }
        panel.classList.toggle('show', expanded)
        a.classList.toggle('collapsed', !expanded)
        a.setAttribute('aria-expanded', String(expanded))
      })
    }

    const onClick = (e) => {
      const a = e.target.closest('a.icons-collapse-expand, a[data-toggle="collapse"]')
      if (!a || !root.contains(a)) return
      const targetSel = a.getAttribute('href') || a.dataset.target
      if (!targetSel) return
      e.preventDefault()
      const id = targetSel.startsWith('#') ? targetSel.slice(1) : targetSel
      const panel = root.querySelector(`#${esc(id)}`)
      if (!panel) return
      const isShown = panel.classList.contains('show')
      panel.classList.toggle('show', !isShown)
      a.classList.toggle('collapsed', isShown)
      a.setAttribute('aria-expanded', String(!isShown))
    }

    initStates()
    root.addEventListener('click', onClick)
    return () => root.removeEventListener('click', onClick)
  }, [content])

  const submitAssignmentFlow = async (finalize) => {
    try {
  setErrorNote('')
      if (!modal.assignId) {
        await fetchAssignStatusIfPossible(modal.module)
        if (!modal.assignId) return
      }
      setSubmitting(true)
      const payloadFiles = await Promise.all(files.map(fileToBase64))
      const upRes = await apiRequest.post(`/assignments/${modal.assignId}/upload`, { files: payloadFiles })
      const draftitemid = upRes.data?.draftitemid
      if (!draftitemid) throw new Error('Upload échoué')
      if (finalize) {
        await apiRequest.post(`/assignments/${modal.assignId}/submit`, { draftitemid, acceptStatement: true })
        setStatusNote('Remise définitive effectuée ✅')
      } else {
        await apiRequest.post(`/assignments/${modal.assignId}/save`, { draftitemid })
        setStatusNote('Brouillon enregistré 💾')
      }
      setFiles([])
    } catch (e) {
      const status = e?.response?.status
      let msg = ''
      if (status === 413) msg = 'Fichier trop volumineux (max 50 Mo par envoi).'
      else if (status === 401) msg = 'Session expirée. Veuillez vous reconnecter.'
      else msg = e?.response?.data?.error || 'Erreur lors de la remise. Veuillez réessayer.'
      setErrorNote(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      const base64 = typeof result === 'string' ? result.split(',').pop() : ''
      resolve({ filename: file.name, mimetype: file.type || 'application/octet-stream', contentBase64: base64 })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const onFilePick = (e) => {
    const list = Array.from(e.target.files || [])
    setFiles(list)
  }
  const onDragOver = (e) => { e.preventDefault() }
  const onDrop = (e) => {
    e.preventDefault()
    const list = Array.from(e.dataTransfer.files || [])
    setFiles(list)
  }

  return (
    <div className={`content universitice ${entered ? 'page-enter' : ''}`}>
      <div className='dashboard-header'>
        <div className='dashboard-title'>
          <h1>Mes cours</h1>
          <p>UniversiTice</p>
        </div>
        <div className='ut-actions'>
          <label className='ut-switch'>
            <input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} />
            <span className="ut-slider" />
            <span className="ut-switch-label">Afficher les cours cachés</span>
          </label>
        </div>
      </div>

  <div className={`ut-wrapper ${isMobile && selectedId ? 'mobile-details-open' : ''}`}>
        <aside className="ut-courses">
          {coursesLoading ? (
            <Skeleton lines={6} />
          ) : (
            <ul className="ut-course-list">
              {courses.map(c => (
                <li key={c.id} className={c.id === selectedId ? 'active' : ''} onClick={() => setSelectedId(c.id)}>
                  <div className="ut-card-banner" aria-hidden="true">
                    {c.image ? (
                      <img src={c.image} alt="" loading="lazy" />
                    ) : (
                      <div className="ut-card-placeholder" aria-hidden>
                        {getInitials(c.shortname || c.fullname)}
                      </div>
                    )}
                  </div>
                  <div className="ut-course-row">
                    <div className="ut-course-title" title={c.fullname || c.shortname}>{c.fullname || c.shortname}</div>
                    {c.hidden && <span className="ut-badge">Caché</span>}
                  </div>
                  <div className="ut-course-subrow">
                    {c.shortname && <div className="ut-course-sub">{c.shortname}</div>}
                    <div className="ut-course-actions" onClick={(e) => e.stopPropagation()}>
                      {!c.hidden ? (
                        <button className="icon-btn" title="Masquer ce cours" aria-label="Masquer" onClick={async (e) => { e.stopPropagation(); await hideCourse(c.id); const res = await apiRequest.get('/user/moodle/courses', { params: { showHidden } }); setCourses(res.data?.courses || []); }}>
                          <EyeOff size={16} />
                        </button>
                      ) : (
                        <button className="icon-btn" title="Afficher ce cours" aria-label="Afficher" onClick={async (e) => { e.stopPropagation(); await unhideCourse(c.id); const res = await apiRequest.get('/user/moodle/courses', { params: { showHidden } }); setCourses(res.data?.courses || []); }}>
                          <Eye size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>

  <main className={`ut-details ${selectedId ? 'has-selection' : ''} ${isMobile && selectedId ? 'mobile-open' : ''}`}>
          {isMobile && selectedId && (
            <div className="ut-mobile-bar">
              <button className="ut-close" aria-label="Fermer" onClick={() => closeTop()}>✕</button>
            </div>
          )}
          {!selectedId && !isMobile && (
            <div className="ut-placeholder">Sélectionnez un cours</div>
          )}

          {selectedId && contentLoading && (
            <div className="ut-loading">
              <Skeleton lines={4} />
            </div>
          )}

          {selectedId && !contentLoading && content && (
            <div className="ut-course" ref={courseRef}>
              <div className="ut-course-toolbar">
                {courses.find(x => x.id === selectedId)?.courseurl && (
                  <button className="link-btn" onClick={() => openOnUniversiTice(courses.find(x => x.id === selectedId).courseurl)}>
                    Ouvrir sur UniversiTice
                  </button>
                )}
              </div>
              {content.map(section => {
                const isOpen = openSections.has(section.id)
                return (
                  <section key={section.id} className={`ut-section fade-in ${isOpen ? 'open' : 'closed'}`}>
                    <div className="ut-section-header">
                      {section.name && (
                        <h3 
                          className="ut-section-title" 
                          onClick={() => handleSectionClick(section)}
                        >
                          {section.name}
                        </h3>
                      )}
                      <button
                        className="ut-toggle-btn"
                        onClick={() => toggleSection(section.id)}
                        aria-expanded={isOpen}
                        aria-label={isOpen ? 'Replier la section' : 'Déplier la section'}
                      >
                        {isOpen ? <PanelBottomClose size={18} /> : <PanelLeftOpen size={18} />}
                      </button>
                    </div>
                    {section.summary && (
                      <div className="ut-summary" dangerouslySetInnerHTML={{ __html: adjustHtmlLinks(section.summary) }} />
                    )}
                    <div className="ut-modules" aria-hidden={!isOpen}>
                      {(section.modules || []).map(m => (
                        <div key={m.id} className={`ut-module ut-${m.modname}`}>
                          <div className="ut-module-head">
                            <div className="ut-module-icon">
                              {getModuleIcon(m.modname)}
                            </div>
                            {m.url ? (
                              <a href={m.url} className="ut-module-title-link" target={isMobile ? undefined : '_blank'} rel={isMobile ? undefined : 'noopener noreferrer'}>
                                {m.name}
                              </a>
                            ) : (
                              <div className="ut-module-title">{m.name}</div>
                            )}
                          </div>
                          {/* Render description/label HTML fully if provided */}
                          {m.description && (
                            <div className="ut-module-description" dangerouslySetInnerHTML={{ __html: adjustHtmlLinks(m.description) }} />
                          )}
                          {/* Assignment action */}
                          {(m.modname === 'assign' || m.modname === 'assignment') && (
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                              <button className="btn" onClick={() => openSubmitModal(selectedId, m)}>
                                <Upload size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Remettre
                              </button>
                            </div>
                          )}
                          {m.contents && m.contents.length > 0 && (
                            <ul className="ut-files">
                              {m.contents.map((f, idx) => (
                                <li key={idx}>
                                  <a href={f.fileurl} target={isMobile ? undefined : '_blank'} rel={isMobile ? undefined : 'noopener noreferrer'}>
                                    <Download size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                    {f.filename} {f.filesize ? `(${Math.round(f.filesize / 1024)} Ko)` : ''}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          )}

          {error && (
            <div className="ut-error">{error}</div>
          )}
        </main>
      </div>
      {/* Submit modal */}
      {modal.open && (
        <div className="ut-modal-backdrop" role="dialog" aria-modal="true">
          <div className="ut-modal">
            <div className="ut-modal-head">
              <div className="ut-modal-title-row">
                <div className="ut-modal-title">Remise de devoir — {modal.module?.name || ''}</div>
                {assignDetails?.locked && (
                  <div className="ut-status-chip locked"><Lock size={14} /> Verrouillé</div>
                )}
              </div>
              <button className="icon-btn" onClick={() => setModal({ open: false })}>✕</button>
            </div>
            <div className="ut-modal-body">
              {assignStatusLoading ? (
                <Skeleton lines={3} />
              ) : (
                <>
                  {assignDetails && (
                    <div className="ut-status">
                      <div className="ut-status-meta">
                        {assignDetails.openLabel && <div className="ut-status-meta-item">{assignDetails.openLabel}</div>}
                        {assignDetails.dueLabel && <div className="ut-status-meta-item">{assignDetails.dueLabel}</div>}
                        {assignDetails.closeLabel && <div className="ut-status-meta-item">{assignDetails.closeLabel}</div>}
                      </div>
                      <div className="ut-status-section">Conditions d’achèvement</div>
                      <div className="ut-status-section">Statut de remise</div>
                      <div className="ut-status-grid">
                        <div>Numéro de tentative</div>
                        <div>{assignDetails.attempt}</div>
                        <div>Statut des travaux remis</div>
                        <div>{assignDetails.work}</div>
                        <div>Statut de l’évaluation</div>
                        <div>{assignDetails.grading}</div>
                      </div>
                    </div>
                  )}
                  {errorNote && <div className="ut-error-note">{errorNote}</div>}
                  {statusNote && !errorNote && <div className="badge" style={{ marginTop: 8 }}>{statusNote}</div>}
                  <div className="dropzone" onDragOver={onDragOver} onDrop={onDrop}>
                    <input type="file" multiple onChange={onFilePick} />
                    <p>Glissez-déposez des fichiers ici ou cliquez pour sélectionner</p>
                    {files.length > 0 && (
                      <ul className="file-list">
                        {files.map((f, i) => (
                          <li key={i}>{f.name} — {(f.size/1024/1024).toFixed(2)} Mo</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="ut-modal-foot">
              <button className="btn-ghost" onClick={() => setModal({ open: false })}>Annuler</button>
              <button className="btn-outline" disabled={submitting || files.length === 0} onClick={() => submitAssignmentFlow(false)}>Enregistrer comme brouillon</button>
              <button className="btn" disabled={submitting || files.length === 0} onClick={() => submitAssignmentFlow(true)}>
                {submitting ? 'Envoi…' : 'Remise définitive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UniversiTice
