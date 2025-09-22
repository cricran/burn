import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const CACHE_KEY = 'burn_latest_release_v1';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12h

async function fetchLatestRelease(owner = 'cricran', repo = 'burn') {
  const headers = { Accept: 'application/vnd.github+json' };

  // Try official releases first
  const latestRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, { headers });
  if (latestRes.ok) {
    const r = await latestRes.json();
    return {
      version: r.tag_name || r.name || 'unknown',
      name: r.name || r.tag_name || 'Dernière version',
      body: r.body || '',
      htmlUrl: r.html_url,
      publishedAt: r.published_at,
      source: 'release',
    };
  }

  // Fallback to latest tag
  const tagsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/tags?per_page=1`, { headers });
  if (tagsRes.ok) {
    const tags = await tagsRes.json();
    if (Array.isArray(tags) && tags.length > 0) {
      const tag = tags[0].name;
      // Try to get the release matching this tag to obtain notes
      const byTagRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/tags/${encodeURIComponent(tag)}`, { headers });
      if (byTagRes.ok) {
        const r = await byTagRes.json();
        return {
          version: r.tag_name || tag,
          name: r.name || tag,
          body: r.body || '',
          htmlUrl: r.html_url,
          publishedAt: r.published_at,
          source: 'tag+release',
        };
      }
      // No release object, return tag with no notes
      return {
        version: tag,
        name: tag,
        body: '',
        htmlUrl: `https://github.com/${owner}/${repo}/releases`,
        publishedAt: undefined,
        source: 'tag',
      };
    }
  }

  throw new Error('Impossible de récupérer la dernière version');
}

export default function ReleaseNotes({ owner = 'cricran', repo = 'burn' }) {
  const [state, setState] = useState({ loading: true, error: null, data: null, expanded: false });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Cache
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          if (Date.now() - (cached.timestamp || 0) < CACHE_TTL_MS) {
            if (!cancelled) setState({ loading: false, error: null, data: cached.data, expanded: false });
            return;
          }
        }

        const data = await fetchLatestRelease(owner, repo);
        if (!cancelled) {
          setState({ loading: false, error: null, data, expanded: false });
          localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
        }
      } catch (e) {
        if (!cancelled) setState({ loading: false, error: e.message || String(e), data: null, expanded: false });
      }
    }

    load();
    return () => { cancelled = true; };
  }, [owner, repo]);

  const shortBody = useMemo(() => {
    const body = state.data?.body || '';
    const lines = body.split('\n');
    const first = lines.slice(0, 8).join('\n');
    return { first, truncated: lines.length > 8 };
  }, [state.data]);

  if (state.loading) {
    return (
      <div className="release-notes">
        <div className="release-header">
          <div className="release-title">Dernière version</div>
          <div className="release-version">Chargement…</div>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="release-notes">
        <div className="release-header">
          <div className="release-title">Dernière version</div>
          <div className="release-version">—</div>
        </div>
        <div className="release-body error">Impossible de charger les notes de version. \n
          <a href={`https://github.com/${owner}/${repo}/releases`} target="_blank" rel="noreferrer">Voir les releases</a>
        </div>
      </div>
    );
  }

  const { data } = state;

  return (
    <div className="release-notes">
      <div className="release-header">
        <div className="release-title">Dernière version</div>
        <div className="release-version">{data?.version}</div>
      </div>

      {data?.body ? (
        <div className="release-body">
          {!state.expanded ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>{shortBody.first}</ReactMarkdown>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>{data.body}</ReactMarkdown>
          )}
          {shortBody.truncated && (
            <button className="release-toggle" onClick={() => setState(s => ({ ...s, expanded: !s.expanded }))}>
              {state.expanded ? 'Réduire' : 'Voir plus'}
            </button>
          )}
        </div>
      ) : (
        <div className="release-body muted">Aucune note fournie pour cette version.</div>
      )}

      <div className="release-links">
        {data?.htmlUrl && (
          <a href={data.htmlUrl} target="_blank" rel="noreferrer">Voir sur GitHub</a>
        )}
        <a href={`https://github.com/${owner}/${repo}/releases`} target="_blank" rel="noreferrer">Toutes les versions</a>
      </div>
    </div>
  );
}
