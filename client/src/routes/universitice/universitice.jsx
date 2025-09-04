import { useState } from 'react'
import apiRequest from '../../utils/apiRequest'

const UniversiTice = () => {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const testConnection = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await apiRequest.get('/user/moodle/test')
      setResult({ ok: res.data?.ok, message: res.data?.message || '' })
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || 'Erreur inconnue'
      setResult({ ok: false, message: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="content" style={{ padding: '1rem' }}>
      <h1>Tester la connexion à UniversiTice</h1>
      <p>Vérifie si le serveur Moodle est joignable avec ton jeton.</p>
      <button onClick={testConnection} disabled={loading} className="primary-btn">
        {loading ? 'Test en cours…' : 'Tester la connexion'}
      </button>
      {result && (
        <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', background: result.ok ? 'var(--green-2, #e8f5e9)' : 'var(--red-2, #ffebee)', color: result.ok ? 'var(--green-11, #1b5e20)' : 'var(--red-11, #b71c1c)' }}>
          <strong>{result.ok ? 'Succès' : 'Échec'}</strong>
          <div style={{ marginTop: '0.25rem' }}>{result.message}</div>
        </div>
      )}
    </div>
  )
}

export default UniversiTice
