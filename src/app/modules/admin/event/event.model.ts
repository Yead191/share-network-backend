import { model, Schema } from "mongoose";
import { IEvent } from "./event.interface";


const eventSchema = new Schema<IEvent>({
    title: {
        type: String,
        required: [true, "Event title is required"],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    image: {
        type: String,
        trim: false
    },
    date: {
        type: Date,
        required: [true, "Event date is required"]
    },
    location: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['webinar', 'workshop', 'seminar', 'conference','all'],
        required: [true, "Event type is required"]
    },


    studentAssigned: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],

    targetTrack: {
        type: Schema.Types.ObjectId,
        ref: 'UserGroupTrack'
    },
    targetGroup: {
        type: Schema.Types.ObjectId,
        ref: 'UserGroup'
    }
}, {
    timestamps: true
})
export const Event = model<IEvent>('Event', eventSchema);