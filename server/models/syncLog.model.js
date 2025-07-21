import { Schema } from "mongoose";
import mongoose from "mongoose";

const SyncLogSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        unique: true 
    },
    lastFetch: { 
        type: Date, 
        default: null 
    },
});

export default mongoose.model('SyncLog', SyncLogSchema);