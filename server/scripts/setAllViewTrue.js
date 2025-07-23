import 'dotenv/config';
import connectDB from '../utils/connectDB.js';
import Calendar from '../models/calendar.model.js';

(async () => {
    try {
        const db = await connectDB();
        console.log('Attempting to update documents...');
        const result = await Calendar.updateMany({}, { $set: { show: true } });
        console.log('Update result:', result);
        console.log(`Modified ${result.modifiedCount} documents`);
        await db.connection.close();
    } catch (err) {
        console.error('Erreur lors de la mise à jour des vues:', err.message);
    } finally {
        process.exit(0);
    }
})();