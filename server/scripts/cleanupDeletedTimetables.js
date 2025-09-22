import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../utils/connectDB.js';
import User from '../models/user.model.js';
import Calendar from '../models/calendar.model.js';

dotenv.config();

async function run() {
  await connectDB();
  const now = new Date();
  const users = await User.find({});
  let totalRemoved = 0;

  for (const user of users) {
    const allowed = new Set((user.icalURL || []).filter(Boolean));
    // Remove future events not belonging to any remaining source
    const res = await Calendar.deleteMany({
      userId: user._id,
      start: { $gte: now },
      sourceUrl: { $nin: Array.from(allowed) }
    });
    totalRemoved += res.deletedCount || 0;
  }

  console.log(`cleanupDeletedTimetables: removed ${totalRemoved} future events not tied to active sources.`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('cleanupDeletedTimetables failed:', err);
  process.exit(1);
});
