import 'dotenv/config';
import fetch from 'node-fetch';
import https from 'https';

const agent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });
const BASE = (process.env.MOODLE_BASE_URL || '').replace(/\/?$/, '/');

// In-memory cache with TTL
const cache = new Map(); // key -> { expire: number, value: any, promise?: Promise }
const now = () => Date.now();

const getCache = (key) => {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expire && entry.expire < now()) { cache.delete(key); return undefined; }
  return entry.value;
}
const setCache = (key, value, ttlMs) => {
  cache.set(key, { value, expire: ttlMs ? now() + ttlMs : 0 });
}

// Simple promise dedupe per key
const inflight = new Map(); // key -> Promise
const dedupe = async (key, factory) => {
  if (inflight.has(key)) return inflight.get(key);
  const p = factory().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

// Minimal concurrency limiter
let current = 0;
const MAX_CONCURRENCY = 5;
const queue = [];
const withSemaphore = async (fn) => {
  if (current >= MAX_CONCURRENCY) {
    await new Promise((resolve) => queue.push(resolve));
  }
  current++;
  try {
    return await fn();
  } finally {
    current--;
    const next = queue.shift();
    if (next) next();
  }
}

// Retry with backoff+jitter on 429/5xx
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fetchWithRetry = async (url, options = {}, retries = 2) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { agent, redirect: 'follow', ...options });
      if (res.status >= 500 || res.status === 429) {
        if (attempt < retries) {
          const backoff = Math.min(2000, 300 * 2 ** attempt) + Math.floor(Math.random() * 200);
          await sleep(backoff);
          continue;
        }
      }
      return res;
    } catch (e) {
      if (attempt < retries) { await sleep(200 + Math.floor(Math.random() * 200)); continue; }
      throw e;
    }
  }
}

const commonHeaders = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 12; ...MoodleMobile 4.5.0 (45002)',
  'Accept': 'application/json, text/plain, */*',
  'X-Requested-With': 'com.moodle.moodlemobile',
  'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
};

const sanitizeToken = (t) => (typeof t === 'string' ? t.trim().replace(/^:+/, '').replace(/:+$/, '') : '');

// Call REST wsfunction with args
export const callWs = async (token, wsfunction, args = {}) => {
  const t = sanitizeToken(token);
  const params = new URLSearchParams({
    wstoken: t,
    wsfunction,
    moodlewsrestformat: 'json',
    ...Object.fromEntries(Object.entries(args).map(([k, v]) => [k, String(v)]))
  });
  const url = `${BASE}webservice/rest/server.php?${params.toString()}`;
  const res = await withSemaphore(() => fetchWithRetry(url, { headers: commonHeaders }));
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`WS HTTP ${res.status}`);
  if (!data) throw new Error('WS parse error');
  if (data.exception || data.errorcode === 'invalidtoken' || data.error) {
    const err = new Error(data.message || data.error || 'WS error');
    err.code = data.errorcode || data.exception;
    throw err;
  }
  return data;
}

// Fallback via mobile call
export const callMobile = async (token, requests) => {
  const t = sanitizeToken(token);
  const url = `${BASE}tool/mobile/call.php?moodlewsrestformat=json&wsfunction=tool_mobile_call_external_functions&wstoken=${encodeURIComponent(t)}`;
  const payload = new URLSearchParams({ requests: JSON.stringify(requests) });
  const res = await withSemaphore(() => fetchWithRetry(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...commonHeaders }, body: payload.toString() }));
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) throw new Error(`Mobile call failed ${res.status}`);
  if (data.exception) { const e = new Error(data.message || 'Mobile WS error'); e.code = data.exception; throw e; }
  return data;
}

export const getSiteInfo = async (token) => {
  const key = `siteinfo:${sanitizeToken(token)}`;
  const cached = getCache(key);
  if (cached) return cached;
  return dedupe(key, async () => {
    try {
      const info = await callWs(token, 'core_webservice_get_site_info');
      setCache(key, info, 10 * 60 * 1000);
      return info;
    } catch (e) {
      // fallback mobile
      const resp = await callMobile(token, [{ index: 0, methodname: 'core_webservice_get_site_info', args: {} }]);
      const info = resp?.responses?.[0]?.data;
      if (!info) throw new Error('No site info');
      setCache(key, info, 10 * 60 * 1000);
      return info;
    }
  });
}

export const getUserCourses = async (token, userid) => {
  const key = `courses:${sanitizeToken(token)}:${userid}`;
  const cached = getCache(key);
  if (cached) return cached;
  return dedupe(key, async () => {
    try {
      const courses = await callWs(token, 'core_enrol_get_users_courses', { userid });
      setCache(key, courses, 10 * 60 * 1000);
      return courses;
    } catch (e) {
      // fallback via mobile call
      const resp = await callMobile(token, [{ index: 0, methodname: 'core_enrol_get_users_courses', args: { userid } }]);
      const courses = resp?.responses?.[0]?.data;
      if (!courses) throw new Error('No courses');
      setCache(key, courses, 10 * 60 * 1000);
      return courses;
    }
  });
}

// Courses by timeline classification (e.g., hidden, favourite, inprogress)
export const getCoursesByClassification = async (token, classification = 'hidden', limit = 0, offset = 0, sort = 'fullname') => {
  try {
    const data = await callWs(token, 'core_course_get_enrolled_courses_by_timeline_classification', { classification, limit, offset, sort });
    return data?.courses || [];
  } catch (e) {
    try {
      const resp = await callMobile(token, [{ index: 0, methodname: 'core_course_get_enrolled_courses_by_timeline_classification', args: { classification, limit, offset, sort } }]);
      return resp?.responses?.[0]?.data?.courses || [];
    } catch (err) {
      return [];
    }
  }
}

// Attempt to set hidden courses via user preference used by My overview block
export const setHiddenCoursesPreference = async (token, courseIds = []) => {
  try {
    const preferences = [{ name: 'block_myoverview_hidden_courses', value: JSON.stringify(courseIds.map(Number)) }];
    const res = await callWs(token, 'core_user_update_user_preferences', { preferences: JSON.stringify(preferences) });
    return true;
  } catch (e) {
    try {
      const requests = [{ index: 0, methodname: 'core_user_update_user_preferences', args: { preferences: [{ name: 'block_myoverview_hidden_courses', value: JSON.stringify(courseIds.map(Number)) }] } }];
      await callMobile(token, requests);
      return true;
    } catch {
      return false;
    }
  }
}

export const getCourseContents = async (token, courseid) => {
  const key = `contents:${sanitizeToken(token)}:${courseid}`;
  const cached = getCache(key);
  if (cached) return cached;
  return dedupe(key, async () => {
    try {
      const contents = await callWs(token, 'core_course_get_contents', { courseid });
      setCache(key, contents, 5 * 60 * 1000);
      return contents;
    } catch (e) {
      const resp = await callMobile(token, [{ index: 0, methodname: 'core_course_get_contents', args: { courseid } }]);
      const contents = resp?.responses?.[0]?.data;
      if (!contents) throw new Error('No contents');
      setCache(key, contents, 5 * 60 * 1000);
      return contents;
    }
  });
}

export const buildCourseUrl = (courseid) => `${BASE}course/view.php?id=${courseid}`;

// Proxy file download using token
export const buildAuthenticatedFileUrl = (rawUrl, token) => {
  const t = sanitizeToken(token);
  try {
    const u = new URL(rawUrl);
    // Ensure same Moodle domain
    if (!u.href.startsWith(BASE)) return null;
    // append token
    if (!u.searchParams.has('token')) {
      u.searchParams.set('token', t);
    }
    return u.toString();
  } catch (e) {
    return null;
  }
}

export default { getSiteInfo, getUserCourses, getCoursesByClassification, setHiddenCoursesPreference, getCourseContents, buildCourseUrl, buildAuthenticatedFileUrl };
