import { useEffect, useState } from 'react'
import { ExternalLink, GraduationCap } from 'lucide-react'
import './utCoursesWidget.css'
import apiRequest from '../../utils/apiRequest'
import { useNavigate } from 'react-router-dom'

const UtCoursesWidget = () => {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'UT'
    const words = name.trim().split(/\s+/).filter(Boolean)
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
    return (words[0][0] + words[1][0]).toUpperCase()
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await apiRequest.get('/user/moodle/courses', { params: { showHidden: false } })
        if (!cancelled) setCourses(res.data?.courses || [])
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.error || 'Erreur de chargement')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const openCourse = (id) => {
    navigate(`/universitice?course=${id}`)
  }

  return (
    <div className="ut-widget">
      <div className="module-header">
        <h3>Mes cours UniversiTice</h3>
        <a className="see-all" href="/universitice" onClick={(e) => { e.preventDefault(); navigate('/universitice') }}>
          Ouvrir <ExternalLink size={14} />
        </a>
      </div>
      {loading ? (
        <div className="utw-loading">Chargement…</div>
      ) : error ? (
        <div className="utw-error">{String(error)}</div>
      ) : courses.length === 0 ? (
        <div className="utw-empty">
          <GraduationCap size={36} />
          <p>Aucun cours visible</p>
        </div>
      ) : (
        <ul className="utw-list">
          {courses.map(c => (
            <li key={c.id} className="utw-item" onClick={() => openCourse(c.id)}>
              {c.image ? (
                <img className="utw-thumb" src={c.image} alt="" loading="lazy" />
              ) : (
                <div className="utw-thumb utw-thumb-placeholder" aria-hidden>
                  {getInitials(c.shortname || c.fullname)}
                </div>
              )}
              <div className="utw-meta">
                <div className="utw-title" title={c.fullname || c.shortname}>{c.fullname || c.shortname}</div>
                {c.shortname && <div className="utw-sub">{c.shortname}</div>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default UtCoursesWidget
