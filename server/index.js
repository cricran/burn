import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import connectDB from './utils/connectDB.js';
import userRouter from './routes/user.route.js';
import calendarRouter from './routes/calendar.route.js';
import noteRouter from './routes/note.route.js';
import colorSettingsRouter from './routes/colorSettings.route.js';
import hiddenEventsRouter from './routes/hiddenEvents.route.js';


const app = express();

app.use(express.json());
app.use(cookieParser()); 

const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:80',
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Accept', 'X-Requested-With']
}));

app.use('/user', userRouter);
app.use('/calendar', calendarRouter);
app.use('/note', noteRouter);
app.use('/color-settings', colorSettingsRouter);
app.use('/hidden-events', hiddenEventsRouter);  


// --- Start the Server ---
app.listen(PORT, async () => {
    await connectDB();
    console.log(`Backend server listening on port ${PORT}`);;
});