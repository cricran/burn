import Calendar from '../models/calendar.model.js';
import fetch from 'node-fetch'
import ical from 'node-ical'
import SyncLog from '../models/syncLog.model.js';



export async function fetchAndParseIcal(userId, icalUrls) {
  if (!Array.isArray(icalUrls) || icalUrls.length === 0) {
    console.warn(`⚠️ Aucune URL iCal fournie pour l'utilisateur ${userId}`);
    return [];
  }

  const now = new Date();

  const fetchPromises = icalUrls.map(async (url) => {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`❌ Échec téléchargement iCal : ${url}`);
        return []; // pas d'erreur, on ignore
      }

      const data = await res.text();
      const parsed = ical.parseICS(data);

      


        return Object.values(parsed)
            .filter(e => e.type === 'VEVENT')
            .map(e => ({
                uid: e.uid,
                title: e.summary || '',
                start: e.start,
                end: e.end,
                description: e.description || '',
                location: e.location || '',
                userId,
                cancelled: false,
                lastSynced: now,
            })
        );
    } catch (err) {
      console.error(`❌ Erreur avec ${url} :`, err.message || err);
      return [];
    }
  });

  const allResults = await Promise.all(fetchPromises);
  const allEvents = allResults.flat(); // fusionne les tableaux
  return allEvents;
}


const updateCalendar = async (userId, icalSources, start) => {
  const now = new Date()

  // Vérifier s’il faut synchroniser
  const log = await SyncLog.findOne({ userId })

  const verbose = process.env.DEBUG_CALENDAR === 'true';
  if (log && verbose) {
    console.log(`🕒 Dernière synchronisation pour ${userId} : ${log.lastFetch}`)
  }

  if (log && now - log.lastFetch < 30 * 60 * 1000) {
    if (verbose) console.log(`🕒 Moins de 30 min depuis dernier fetch pour ${userId}, skip.`)
    return
  }

  // Récupération et filtrage
  const freshEvents = await fetchAndParseIcal(userId, icalSources)
  const eventsToSync = freshEvents.filter(e => e.start >= start)
  const freshUIDs = eventsToSync.map(e => e.uid)

  // Upsert des événements actuels
  for (const e of eventsToSync) {
    await Calendar.updateOne(
      { uid: e.uid, userId },
      { ...e, cancelled: false, lastSynced: now },
      { upsert: true }
    )
  }

  // Marquer comme annulés ceux qui ne sont plus dans le .ics
  await Calendar.updateMany(
    {
      userId,
      start: { $gte: start },
      uid: { $nin: freshUIDs },
      cancelled: false
    },
    {
      $set: { cancelled: true, lastSynced: now }
    }
  )

  // Mise à jour du SyncLog
  await SyncLog.updateOne(
    { userId },
    { lastFetch: now },
    { upsert: true }
  )

  if (verbose) console.log(`✅ Sync terminée pour ${userId}, ${eventsToSync.length} événements traités.`)
}



export default updateCalendar;