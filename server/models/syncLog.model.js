import { Schema } from "mongoose";
import mongoose from "mongoose";

const SyncLogSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        unique: true 
    },
    // Backward-compatible: keep lastFetch but prefer lastSuccess/lastAttempt
    lastFetch: { type: Date, default: null },
    lastAttempt: { type: Date, default: null },
    lastSuccess: { type: Date, default: null },
    lastError: { type: String, default: null },
});

export default mongoose.model('SyncLog', SyncLogSchema);