import Calendar from '../models/calendar.model.js';
import fetch from 'node-fetch'
import ical from 'node-ical'
import SyncLog from '../models/syncLog.model.js';



export async function fetchAndParseIcal(userId, icalUrls) {
  if (!Array.isArray(icalUrls) || icalUrls.length === 0) {
    console.warn(`⚠️ Aucune URL iCal fournie pour l'utilisateur ${userId}`);
  return { events: [], succeeded: [], failed: [] };
  }

  const now = new Date();

  const fetchPromises = icalUrls.map(async (url) => {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`❌ Échec téléchargement iCal : ${url}`);
        return { url, ok: false, events: [] };
      }

      const data = await res.text();
      const parsed = ical.parseICS(data);

      


        const events = Object.values(parsed)
          .filter(e => e.type === 'VEVENT')
          .map(e => ({
            uid: e.uid,
            title: e.summary || '',
            start: e.start,
            end: e.end,
            description: e.description || '',
            location: e.location || '',
            userId,
            sourceUrl: url,
            cancelled: false,
            lastSynced: now,
          }));
        return { url, ok: true, events };
    } catch (err) {
      console.error(`❌ Erreur avec ${url} :`, err.message || err);
      return { url, ok: false, events: [] };
    }
  });

  const results = await Promise.all(fetchPromises);
  const events = results.flatMap(r => r.events);
  const succeeded = results.filter(r => r.ok).map(r => r.url);
  const failed = results.filter(r => !r.ok).map(r => r.url);
  return { events, succeeded, failed };
}


const updateCalendar = async (userId, icalSources, start) => {
  const now = new Date();
  const verbose = process.env.DEBUG_CALENDAR === 'true';

  // Rate limiting: prefer lastAttempt; fallback to lastFetch for backward compatibility
  const log = await SyncLog.findOne({ userId });
  const lastCheck = log?.lastAttempt || log?.lastFetch;
  if (log && lastCheck && now - new Date(lastCheck) < 30 * 60 * 1000) {
    if (verbose) console.log(`🕒 Moins de 30 min depuis dernier essai pour ${userId}, skip.`);
    return { skipped: true };
  }

  // mark attempt
  await SyncLog.updateOne(
    { userId },
    { $set: { lastAttempt: now } },
    { upsert: true }
  );

  // Fetch
  const fetchResult = await fetchAndParseIcal(userId, icalSources);
  const freshEvents = fetchResult.events;
  const succeededSources = new Set(fetchResult.succeeded || []);
  const failedSources = new Set(fetchResult.failed || []);
  const hasAnyFresh = freshEvents.length > 0;
  let cancelledCount = 0;
  let upsertedCount = 0;
  let errorFlag = false;

  try {
  const eventsToSync = freshEvents.filter(e => e.start >= start);
  const freshUIDs = eventsToSync.map(e => e.uid);

    if (eventsToSync.length > 0) {
      // Upsert events
      for (const e of eventsToSync) {
        const res = await Calendar.updateOne(
          { uid: e.uid, userId },
          { ...e, cancelled: false, lastSynced: now },
          { upsert: true }
        );
        upsertedCount += (res.upsertedCount || res.modifiedCount || 0);
      }
    }

    // Cancel only within sources that succeeded. If none succeeded, don't cancel anything.
    if (Array.isArray(icalSources) && icalSources.length > 0 && succeededSources.size > 0) {
      const res = await Calendar.updateMany(
        {
          userId,
          start: { $gte: start },
          sourceUrl: { $in: Array.from(succeededSources) },
          uid: { $nin: freshUIDs },
          cancelled: false
        },
        {
          $set: { cancelled: true, lastSynced: now }
        }
      );
      cancelledCount = res.modifiedCount || 0;
    }

    // Set error flags
    if (succeededSources.size === 0) {
      // All sources failed
      if (verbose) console.warn(`⚠️ Aucune source n'a répondu pour ${userId}. On conserve les événements existants.`);
      errorFlag = 'fetch-empty';
    } else if (failedSources.size > 0) {
      errorFlag = 'partial-empty';
    }

    // success log
    await SyncLog.updateOne(
      { userId },
      { $set: { lastSuccess: now, lastFetch: now, lastError: errorFlag || null } },
      { upsert: true }
    );

    if (verbose) console.log(`✅ Sync terminée pour ${userId}, upsert:${upsertedCount}, cancelled:${cancelledCount}, errorFlag:${errorFlag}`);
  return { error: errorFlag || null, upsertedCount, cancelledCount };
  } catch (e) {
    // record error
    await SyncLog.updateOne(
      { userId },
      { $set: { lastError: e?.message || String(e) } },
      { upsert: true }
    );
    if (verbose) console.error('❌ Sync error:', e);
    return { error: e?.message || 'sync-failed' };
  }
}



export default updateCalendar;