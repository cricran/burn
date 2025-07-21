import { Schema } from "mongoose";
import mongoose from "mongoose";

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        trim: true,
    },
    moodleToken: {
        type: String,
        required: true,
        trim: true,
    },
    icalURL: [{
        type: String,
        required: true,
        trim: true,
    }],
},
    {
        timestamps: true,
    }
);

export default mongoose.model("User", userSchema);