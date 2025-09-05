import { useEffect, useMemo, useState } from 'react'
import { PanelBottomClose, PanelLeftOpen, FileText, BookOpen, Link, File, Video, Image, Archive, HelpCircle, Upload, Download, EyeOff, Eye } from 'lucide-react'
import apiRequest from '../../utils/apiRequest'
import './universitice.css'
import useHiddenCoursesStore from '../../utils/hiddenCoursesStore'

const Skeleton = ({ lines = 3 }) => (
  <div className="skel">
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="skel-line" />
    ))}
  </div>
)

const UniversiTice = () => {
  const { hiddenCourses, loadHiddenCourses, hideCourse, unhideCourse, showHidden, setShowHidden } = useHiddenCoursesStore()
  const [courses, setCourses] = useState([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [content, setContent] = useState(null)
  const [contentLoading, setContentLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(max-width: 820px)').matches : false)
  const [openSections, setOpenSections] = useState(new Set())

  // Simple in-memory cache per session to avoid re-fetching
  const contentsCache = useMemo(() => new Map(), [])

  // Ouvrir toutes les sections par défaut quand le contenu est chargé
  useEffect(() => {
    if (content && content.length > 0) {
      const allSectionIds = new Set(content.map(section => section.id))
      setOpenSections(allSectionIds)
    }
  }, [content])

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

  // Track mobile breakpoint to control overlay behavior
  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia('(max-width: 820px)')
    const onChange = (e) => setIsMobile(e.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

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
    window.open(courseUrl, '_blank', 'noopener,noreferrer')
  }

  const handleSectionClick = (section) => {
    // Si la section contient des modules avec des URLs, ouvrir le premier document
    const modulesWithUrls = section.modules?.filter(m => m.url) || []
    if (modulesWithUrls.length > 0) {
      window.open(modulesWithUrls[0].url, '_blank', 'noopener,noreferrer')
    } else {
      // Sinon, juste toggle la section
      toggleSection(section.id)
    }
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
        return <Upload size={16} />
      default:
        return <File size={16} />
    }
  }

  // Mark initial enter for animations
  const [entered, setEntered] = useState(false)
  useEffect(() => { setEntered(true) }, [])

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
                    {c.image && <img src={c.image} alt="" loading="lazy" />}
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
              <button className="ut-close" aria-label="Fermer" onClick={() => setSelectedId(null)}>Fermer</button>
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
            <div className="ut-course">
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
                          style={{ cursor: section.modules?.some(m => m.url) ? 'pointer' : 'default' }}
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
                      <div className="ut-summary" dangerouslySetInnerHTML={{ __html: section.summary }} />
                    )}
                    <div className="ut-modules" aria-hidden={!isOpen}>
                      {(section.modules || []).map(m => (
                        <div key={m.id} className={`ut-module ut-${m.modname}`}>
                          <div className="ut-module-head">
                            <div className="ut-module-icon">
                              {getModuleIcon(m.modname)}
                            </div>
                            {m.url ? (
                              <a href={m.url} className="ut-module-title-link" target="_blank" rel="noopener noreferrer">
                                {m.name}
                              </a>
                            ) : (
                              <div className="ut-module-title">{m.name}</div>
                            )}
                          </div>
                          {m.contents && m.contents.length > 0 && (
                            <ul className="ut-files">
                              {m.contents.map((f, idx) => (
                                <li key={idx}>
                                  <a href={f.fileurl} target="_blank" rel="noopener noreferrer">
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
    </div>
  )
}

export default UniversiTice
