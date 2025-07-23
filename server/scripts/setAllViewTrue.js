import 'dotenv/config';
import connectDB from '../utils/connectDB.js';
import Calendar from '../models/calendar.model.js';

await connectDB();

const result = await Calendar.updateMany({}, { $set: { view: true } });
console.log(result);

process.exit();