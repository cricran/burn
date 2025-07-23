import { Schema } from "mongoose";
import mongoose from "mongoose";

const calendarSchema = new Schema({
    uid: String,
    title: String,
    description: String,
    location: String,
    start: Date,
    end: Date,
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    cancelled: {
        type: Boolean,
        default: false
    },
    tasks: [
        {
             text: String, 
             done: Boolean 
        }
    ],
    lastSynced: Date,
    show : {
        type: Boolean,
        default: true
    }
})

export default mongoose.model("Calendar", calendarSchema);