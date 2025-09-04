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

const defaultOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:80',
    'http://127.0.0.1:80'
];
const configuredOrigin = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [];
const allowedOrigins = [...new Set([...configuredOrigin, ...defaultOrigins])];

app.use(cors({
    origin: (origin, cb) => {
        // Allow non-browser clients (no origin)
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
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